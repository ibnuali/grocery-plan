import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { db } from '#/db'
import { item, category, globalItem, globalPrice, user } from '#/db/schema'
import { eq, and } from 'drizzle-orm'
import { requireAuth } from '#/lib/auth'
import { validateBody, createItemSchema } from '#/lib/validations'

export const Route = createFileRoute('/api/items/')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const session = await requireAuth(request)

        // Get user's cityId for price lookup
        const [userData] = await db
          .select({ cityId: user.cityId })
          .from(user)
          .where(eq(user.id, session.user.id))

        const items = await db
          .select({
            id: item.id,
            name: item.name,
            categoryId: item.categoryId,
            estimatedPrice: item.estimatedPrice,
            globalItemId: item.globalItemId,
            createdAt: item.createdAt,
            categoryName: category.name,
            globalItemName: globalItem.name,
            globalItemUnit: globalItem.unit,
            suggestedPrice: globalPrice.price,
          })
          .from(item)
          .leftJoin(category, eq(item.categoryId, category.id))
          .leftJoin(globalItem, eq(item.globalItemId, globalItem.id))
          .leftJoin(
            globalPrice,
            and(
              eq(globalPrice.globalItemId, item.globalItemId),
              eq(globalPrice.cityId, userData?.cityId ?? ''),
            ),
          )
          .where(eq(item.userId, session.user.id))

        return json({ items })
      },
      POST: async ({ request }) => {
        const session = await requireAuth(request)
        const body = validateBody(createItemSchema, await request.json())

        const id = crypto.randomUUID()
        const now = new Date()

        // If globalItemId and cityId provided, look up suggested price
        let estimatedPrice = body.estimatedPrice
        if (body.globalItemId && body.cityId) {
          const [priceData] = await db
            .select({ price: globalPrice.price })
            .from(globalPrice)
            .where(
              and(
                eq(globalPrice.globalItemId, body.globalItemId),
                eq(globalPrice.cityId, body.cityId),
              ),
            )
          if (priceData) {
            estimatedPrice = priceData.price
          }
        }

        const [newItem] = await db
          .insert(item)
          .values({
            id,
            name: body.name,
            categoryId: body.categoryId,
            estimatedPrice,
            globalItemId: body.globalItemId ?? null,
            userId: session.user.id,
            createdAt: now,
            updatedAt: now,
          })
          .returning()

        return json(newItem, { status: 201 })
      },
    },
  },
})
