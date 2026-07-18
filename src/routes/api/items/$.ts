import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { db } from '#/db'
import { item } from '#/db/schema'
import { eq, and } from 'drizzle-orm'
import { requireAuth } from '#/lib/auth'
import { validateBody, updateItemSchema } from '#/lib/validations'

export const Route = createFileRoute('/api/items/$')({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const session = await requireAuth(request)

        const id = params._splat!

        const [found] = await db
          .select()
          .from(item)
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
