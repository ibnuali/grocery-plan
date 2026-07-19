import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { db } from '#/db'
import { shoppingListItem, item, shoppingList } from '#/db/schema'
import { eq, and } from 'drizzle-orm'
import { requireAuth } from '#/lib/auth'
import { validateBody, addListItemSchema, updateListItemSchema, deleteListItemSchema } from '#/lib/validations'

export const Route = createFileRoute('/api/lists/items/')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const session = await requireAuth(request)

        const url = new URL(request.url)
        const listId = url.searchParams.get('listId')

        if (!listId) {
          return json({ error: 'listId is required' }, { status: 400 })
        }

        // Verify the list belongs to the user
        const [list] = await db
          .select()
          .from(shoppingList)
          .where(and(eq(shoppingList.id, listId), eq(shoppingList.userId, session.user.id)))

        if (!list) {
          return json({ error: 'List not found' }, { status: 404 })
        }

        const items = await db
          .select({
            id: shoppingListItem.id,
            itemId: shoppingListItem.itemId,
            quantity: shoppingListItem.quantity,
            unit: shoppingListItem.unit,
            notes: shoppingListItem.notes,
            purchased: shoppingListItem.purchased,
            createdAt: shoppingListItem.createdAt,
            itemName: item.name,
            estimatedPrice: item.estimatedPrice,
          })
          .from(shoppingListItem)
          .innerJoin(item, eq(shoppingListItem.itemId, item.id))
          .where(eq(shoppingListItem.shoppingListId, listId))

        return json({ items })
      },
      POST: async ({ request }) => {
        const session = await requireAuth(request)
        const body = validateBody(addListItemSchema, await request.json())

        // Verify the list belongs to the user
        const [list] = await db
          .select()
          .from(shoppingList)
          .where(and(eq(shoppingList.id, body.shoppingListId), eq(shoppingList.userId, session.user.id)))

        if (!list) {
          return json({ error: 'List not found' }, { status: 404 })
        }

        const id = crypto.randomUUID()
        const now = new Date()

        const [newItem] = await db
          .insert(shoppingListItem)
          .values({
            id,
            shoppingListId: body.shoppingListId,
            itemId: body.itemId,
            quantity: body.quantity,
            createdAt: now,
          })
          .returning()

        return json(newItem, { status: 201 })
      },
      PUT: async ({ request }) => {
        const session = await requireAuth(request)
        const body = validateBody(updateListItemSchema, await request.json())

        // Verify the item belongs to a list owned by the user
        const [owned] = await db
          .select({ id: shoppingListItem.id })
          .from(shoppingListItem)
          .innerJoin(shoppingList, eq(shoppingListItem.shoppingListId, shoppingList.id))
          .where(
            and(
              eq(shoppingListItem.id, body.id),
              eq(shoppingList.userId, session.user.id),
            ),
          )

        if (!owned) {
          return json({ error: 'Item not found' }, { status: 404 })
        }

        const updates: Record<string, unknown> = {}
        if (body.quantity !== undefined) updates.quantity = body.quantity
        if (body.unit !== undefined) updates.unit = body.unit
        if (body.notes !== undefined) updates.notes = body.notes
        if (body.purchased !== undefined) updates.purchased = body.purchased

        const [updated] = await db
          .update(shoppingListItem)
          .set(updates)
          .where(eq(shoppingListItem.id, body.id))
          .returning()

        return json(updated)
      },
      DELETE: async ({ request }) => {
        const session = await requireAuth(request)
        const body = validateBody(deleteListItemSchema, await request.json())

        // Verify the item belongs to a list owned by the user
        const [owned] = await db
          .select({ id: shoppingListItem.id })
          .from(shoppingListItem)
          .innerJoin(shoppingList, eq(shoppingListItem.shoppingListId, shoppingList.id))
          .where(
            and(
              eq(shoppingListItem.id, body.id),
              eq(shoppingList.userId, session.user.id),
            ),
          )

        if (!owned) {
          return json({ error: 'Item not found' }, { status: 404 })
        }

        await db
          .delete(shoppingListItem)
          .where(eq(shoppingListItem.id, body.id))

        return json({ success: true })
      },
    },
  },
})
