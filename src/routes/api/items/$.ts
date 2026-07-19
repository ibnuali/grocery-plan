import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { db } from '#/db'
import { item, category, globalItem, globalPrice, user } from '#/db/schema'
import { eq, and } from 'drizzle-orm'
import { requireAuth } from '#/lib/auth'
import { validateBody, updateItemSchema } from '#/lib/validations'

export const Route = createFileRoute('/api/items/$')({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const session = await requireAuth(request)

        const id = params._splat!

        // Get user's cityId for price lookup
        const [userData] = await db
          .select({ cityId: user.cityId })
          .from(user)
          .where(eq(user.id, session.user.id))

        const [found] = await db
          .select({
            id: item.id,
            name: item.name,
            categoryId: item.categoryId,
            estimatedPrice: item.estimatedPrice,
            globalItemId: item.globalItemId,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
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
          .where(and(eq(item.id, id), eq(item.userId, session.user.id)))

        if (!found) {
          return json({ error: 'Item not found' }, { status: 404 })
        }

        return json(found)
      },
      PUT: async ({ params, request }) => {
        const session = await requireAuth(request)
        const id = params._splat!
        const body = validateBody(updateItemSchema, await request.json())

        const [updated] = await db
          .update(item)
          .set({
            name: body.name,
            categoryId: body.categoryId,
            estimatedPrice: body.estimatedPrice,
            globalItemId: body.globalItemId ?? null,
            updatedAt: new Date(),
          })
          .where(and(eq(item.id, id), eq(item.userId, session.user.id)))
          .returning()

        if (!updated) {
          return json({ error: 'Item not found' }, { status: 404 })
        }

        return json(updated)
      },
      DELETE: async ({ params, request }) => {
        const session = await requireAuth(request)

        const id = params._splat!

        const [deleted] = await db
          .delete(item)
          .where(and(eq(item.id, id), eq(item.userId, session.user.id)))
          .returning()

        if (!deleted) {
          return json({ error: 'Item not found' }, { status: 404 })
        }

        return json({ success: true })
      },
    },
  },
})
