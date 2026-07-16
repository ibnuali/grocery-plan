import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { db } from '#/db'
import { item, category } from '#/db/schema'
import { eq } from 'drizzle-orm'
import { auth } from '#/lib/auth'

export const Route = createFileRoute('/api/items/')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const session = await auth.api.getSession({
          headers: request.headers,
        })

        if (!session?.user) {
          return json({ error: 'Unauthorized' }, { status: 401 })
        }

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
        const session = await auth.api.getSession({
          headers: request.headers,
        })

        if (!session?.user) {
          return json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()

        if (!body.name?.trim() || !body.categoryId || !body.estimatedPrice) {
          return json({ error: 'Name, category, and estimated price are required' }, { status: 400 })
        }

        const id = crypto.randomUUID()
        const now = new Date()

        const [newItem] = await db
          .insert(item)
          .values({
            id,
            name: body.name.trim(),
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
