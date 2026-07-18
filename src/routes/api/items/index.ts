import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { db } from '#/db'
import { item, category } from '#/db/schema'
import { eq } from 'drizzle-orm'
import { requireAuth } from '#/lib/auth'
import { validateBody, createItemSchema } from '#/lib/validations'

export const Route = createFileRoute('/api/items/')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const session = await requireAuth(request)

        const items = await db
          .select({
            id: item.id,
            name: item.name,
            categoryId: item.categoryId,
            estimatedPrice: item.estimatedPrice,
            createdAt: item.createdAt,
            categoryName: category.name,
          })
          .from(item)
          .leftJoin(category, eq(item.categoryId, category.id))
          .where(eq(item.userId, session.user.id))

        return json({ items })
      },
      POST: async ({ request }) => {
        const session = await requireAuth(request)
        const body = validateBody(createItemSchema, await request.json())

        const id = crypto.randomUUID()
        const now = new Date()

        const [newItem] = await db
          .insert(item)
          .values({
            id,
            name: body.name,
            categoryId: body.categoryId,
            estimatedPrice: body.estimatedPrice,
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
