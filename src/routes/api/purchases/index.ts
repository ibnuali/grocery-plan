import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { db } from '#/db'
import { purchase, shoppingListItem, shoppingList } from '#/db/schema'
import { eq, and } from 'drizzle-orm'
import { auth } from '#/lib/auth'

export const Route = createFileRoute('/api/purchases/')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const session = await auth.api.getSession({
          headers: request.headers,
        })

        if (!session?.user) {
          return json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()

        if (!body.shoppingListItemId || !body.actualPrice) {
          return json({ error: 'shoppingListItemId and actualPrice are required' }, { status: 400 })
        }

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
