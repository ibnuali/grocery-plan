import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { db } from '#/db'
import { purchase, shoppingListItem, shoppingList } from '#/db/schema'
import { eq, and } from 'drizzle-orm'
import { requireAuth } from '#/lib/auth'
import { validateBody, createPurchaseSchema } from '#/lib/validations'

export const Route = createFileRoute('/api/purchases/')({
  server: {
    handlers: {
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
