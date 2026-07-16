import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { db } from '#/db'
import { shoppingList, shoppingListItem } from '#/db/schema'
import { eq, count } from 'drizzle-orm'
import { auth } from '#/lib/auth'

export const Route = createFileRoute('/api/lists/')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const session = await auth.api.getSession({
          headers: request.headers,
        })

        if (!session?.user) {
          return json({ error: 'Unauthorized' }, { status: 401 })
        }

        const lists = await db
          .select({
            id: shoppingList.id,
            name: shoppingList.name,
            period: shoppingList.period,
            startDate: shoppingList.startDate,
            endDate: shoppingList.endDate,
            createdAt: shoppingList.createdAt,
          })
          .from(shoppingList)
          .where(eq(shoppingList.userId, session.user.id))

        return json({ lists })
      },
      POST: async ({ request }) => {
        const session = await auth.api.getSession({
          headers: request.headers,
        })

        if (!session?.user) {
          return json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()

        if (!body.name?.trim() || !body.period || !body.startDate || !body.endDate) {
          return json({ error: 'Name, period, start date, and end date are required' }, { status: 400 })
        }

        const id = crypto.randomUUID()
        const now = new Date()

        const [newList] = await db
          .insert(shoppingList)
          .values({
            id,
            name: body.name.trim(),
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
