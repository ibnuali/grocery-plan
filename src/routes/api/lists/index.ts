import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { db } from '#/db'
import { shoppingList, shoppingListItem, item } from '#/db/schema'
import { eq, sql } from 'drizzle-orm'
import { requireAuth } from '#/lib/auth'
import { validateBody, createListSchema } from '#/lib/validations'

export const Route = createFileRoute('/api/lists/')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const session = await requireAuth(request)

        const lists = await db
          .select({
            id: shoppingList.id,
            name: shoppingList.name,
            period: shoppingList.period,
            startDate: shoppingList.startDate,
            endDate: shoppingList.endDate,
            createdAt: shoppingList.createdAt,
            itemCount: sql<number>`count(${shoppingListItem.id})::int`,
            totalEstimate: sql<number>`coalesce(sum(${shoppingListItem.quantity} * ${item.estimatedPrice}), 0)::int`,
          })
          .from(shoppingList)
          .leftJoin(
            shoppingListItem,
            eq(shoppingListItem.shoppingListId, shoppingList.id),
          )
          .leftJoin(item, eq(item.id, shoppingListItem.itemId))
          .where(eq(shoppingList.userId, session.user.id))
          .groupBy(shoppingList.id)

        return json({ lists })
      },
      POST: async ({ request }) => {
        const session = await requireAuth(request)
        const body = validateBody(createListSchema, await request.json())

        const id = crypto.randomUUID()
        const now = new Date()

        const [newList] = await db
          .insert(shoppingList)
          .values({
            id,
            name: body.name,
            period: body.period,
            startDate: new Date(body.startDate),
            endDate: new Date(body.endDate),
            userId: session.user.id,
            createdAt: now,
            updatedAt: now,
          })
          .returning()

        return json(newList, { status: 201 })
      },
    },
  },
})
