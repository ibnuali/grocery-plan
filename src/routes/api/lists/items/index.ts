import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { db } from '#/db'
import { shoppingListItem, item, shoppingList } from '#/db/schema'
import { eq, and } from 'drizzle-orm'
import { auth } from '#/lib/auth'

export const Route = createFileRoute('/api/lists/items/')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const session = await auth.api.getSession({
          headers: request.headers,
        })

        if (!session?.user) {
          return json({ error: 'Unauthorized' }, { status: 401 })
        }

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
        const session = await auth.api.getSession({
          headers: request.headers,
        })

        if (!session?.user) {
          return json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()

        if (!body.shoppingListId || !body.itemId) {
          return json({ error: 'shoppingListId and itemId are required' }, { status: 400 })
        }

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
            quantity: body.quantity || 1,
            createdAt: now,
          })
          .returning()

        return json(newItem, { status: 201 })
      },
      DELETE: async ({ request }) => {
        const session = await auth.api.getSession({
          headers: request.headers,
        })

        if (!session?.user) {
          return json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()

        if (!body.id) {
          return json({ error: 'id is required' }, { status: 400 })
        }

        const [deleted] = await db
          .delete(shoppingListItem)
          .where(eq(shoppingListItem.id, body.id))
          .returning()

        if (!deleted) {
          return json({ error: 'Item not found' }, { status: 404 })
        }

        return json({ success: true })
      },
    },
  },
})
