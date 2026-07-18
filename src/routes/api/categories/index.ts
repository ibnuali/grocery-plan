import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { db } from '#/db'
import { category } from '#/db/schema'
import { eq } from 'drizzle-orm'
import { requireAuth } from '#/lib/auth'
import { validateBody, createCategorySchema } from '#/lib/validations'

export const Route = createFileRoute('/api/categories/')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const session = await requireAuth(request)

        const categories = await db
          .select()
          .from(category)
          .where(eq(category.userId, session.user.id))

        return json({ categories })
      },
      POST: async ({ request }) => {
        const session = await requireAuth(request)
        const body = validateBody(createCategorySchema, await request.json())

        const id = crypto.randomUUID()
        const now = new Date()

        const [newCategory] = await db
          .insert(category)
          .values({
            id,
            name: body.name,
            userId: session.user.id,
            createdAt: now,
            updatedAt: now,
          })
          .returning()

        return json(newCategory, { status: 201 })
      },
    },
  },
})
