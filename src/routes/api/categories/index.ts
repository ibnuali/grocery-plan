import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { db } from '#/db'
import { category } from '#/db/schema'
import { eq } from 'drizzle-orm'
import { auth } from '#/lib/auth'

export const Route = createFileRoute('/api/categories/')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const session = await auth.api.getSession({
          headers: request.headers,
        })

        if (!session?.user) {
          return json({ error: 'Unauthorized' }, { status: 401 })
        }

        const categories = await db
          .select()
          .from(category)
          .where(eq(category.userId, session.user.id))

        return json({ categories })
      },
      POST: async ({ request }) => {
        const session = await auth.api.getSession({
          headers: request.headers,
        })

        if (!session?.user) {
          return json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()

        if (!body.name?.trim()) {
          return json({ error: 'Name is required' }, { status: 400 })
        }

        const id = crypto.randomUUID()
        const now = new Date()

        const [newCategory] = await db
          .insert(category)
          .values({
            id,
            name: body.name.trim(),
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
