import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { db } from '#/db'
import { purchase, shoppingListItem, shoppingList, item } from '#/db/schema'
import { eq, and } from 'drizzle-orm'
import { requireAuth } from '#/lib/auth'
import { validateBody, createPurchaseSchema } from '#/lib/validations'

export const Route = createFileRoute('/api/purchases/')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const session = await requireAuth(request)

        const url = new URL(request.url)
        const listId = url.searchParams.get('listId')

        // Build conditions: always filter by user ownership
        const conditions = and(
          eq(shoppingList.userId, session.user.id),
          ...(listId ? [eq(shoppingList.id, listId)] : []),
        )

        const purchases = await db
          .select({
            id: purchase.id,
            actualPrice: purchase.actualPrice,
            purchasedAt: purchase.purchasedAt,
            quantity: shoppingListItem.quantity,
            itemName: item.name,
            estimatedPrice: item.estimatedPrice,
            listName: shoppingList.name,
            shoppingListItemId: purchase.shoppingListItemId,
          })
          .from(purchase)
          .innerJoin(shoppingListItem, eq(purchase.shoppingListItemId, shoppingListItem.id))
          .innerJoin(item, eq(shoppingListItem.itemId, item.id))
          .innerJoin(shoppingList, eq(shoppingListItem.shoppingListId, shoppingList.id))
          .where(conditions)

        return json({ purchases })
      },
      POST: async ({ request }) => {
        const session = await requireAuth(request)
        const body = validateBody(createPurchaseSchema, await request.json())

        // Verify the shopping list item belongs to the user
        const [listItem] = await db
          .select()
          .from(shoppingListItem)
          .innerJoin(shoppingList, eq(shoppingListItem.shoppingListId, shoppingList.id))
          .where(
            and(
              eq(shoppingListItem.id, body.shoppingListItemId),
              eq(shoppingList.userId, session.user.id)
            )
          )

        if (!listItem) {
          return json({ error: 'Shopping list item not found' }, { status: 404 })
        }

        const id = crypto.randomUUID()
        const now = new Date()

        const [newPurchase] = await db
          .insert(purchase)
          .values({
            id,
            shoppingListItemId: body.shoppingListItemId,
            actualPrice: body.actualPrice,
            purchasedAt: now,
            createdAt: now,
          })
          .returning()

        return json(newPurchase, { status: 201 })
      },
    },
  },
})
