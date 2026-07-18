import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { db } from '#/db'
import { category } from '#/db/schema'
import { eq, and } from 'drizzle-orm'
import { requireAuth } from '#/lib/auth'
import { validateBody, updateCategorySchema } from '#/lib/validations'

export const Route = createFileRoute('/api/categories/$')({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const session = await requireAuth(request)

        const id = params._splat!!

        const [cat] = await db
          .select()
          .from(category)
          .where(and(eq(category.id, id), eq(category.userId, session.user.id)))

        if (!cat) {
          return json({ error: 'Category not found' }, { status: 404 })
        }

        return json(cat)
      },
      PUT: async ({ params, request }) => {
        const session = await requireAuth(request)
        const id = params._splat!
        const body = validateBody(updateCategorySchema, await request.json())

        const [updated] = await db
          .update(category)
          .set({
            name: body.name,
            updatedAt: new Date(),
          })
          .where(and(eq(category.id, id), eq(category.userId, session.user.id)))
          .returning()

        if (!updated) {
          return json({ error: 'Category not found' }, { status: 404 })
        }

        return json(updated)
      },
      DELETE: async ({ params, request }) => {
        const session = await requireAuth(request)

        const id = params._splat!

        const [deleted] = await db
          .delete(category)
          .where(and(eq(category.id, id), eq(category.userId, session.user.id)))
          .returning()

        if (!deleted) {
          return json({ error: 'Category not found' }, { status: 404 })
        }

        return json({ success: true })
      },
    },
  },
})
