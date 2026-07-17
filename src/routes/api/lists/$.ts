import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { db } from '#/db'
import { shoppingList, shoppingListItem } from '#/db/schema'
import { eq, and } from 'drizzle-orm'
import { auth } from '#/lib/auth'

export const Route = createFileRoute('/api/lists/$')({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const session = await auth.api.getSession({
          headers: request.headers,
        })

        if (!session?.user) {
          return json({ error: 'Unauthorized' }, { status: 401 })
        }

        const id = params._splat

        const [list] = await db
          .select()
          .from(shoppingList)
          .where(and(eq(shoppingList.id, id), eq(shoppingList.userId, session.user.id)))

        if (!list) {
          return json({ error: 'List not found' }, { status: 404 })
        }

        return json(list)
      },
      PUT: async ({ params, request }) => {
        const session = await auth.api.getSession({
          headers: request.headers,
        })

        if (!session?.user) {
          return json({ error: 'Unauthorized' }, { status: 401 })
        }

        const id = params._splat
        const body = await request.json()

        if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
          return json({ error: 'Name is required' }, { status: 400 })
        }
        if (!body.period || !['weekly', 'monthly'].includes(body.period)) {
          return json({ error: 'Period must be weekly or monthly' }, { status: 400 })
        }
        if (!body.startDate || !body.endDate) {
          return json({ error: 'Start and end dates are required' }, { status: 400 })
        }

        const [updated] = await db
          .update(shoppingList)
          .set({
            name: body.name,
            period: body.period,
            startDate: new Date(body.startDate),
            endDate: new Date(body.endDate),
            updatedAt: new Date(),
          })
          .where(and(eq(shoppingList.id, id), eq(shoppingList.userId, session.user.id)))
          .returning()

        if (!updated) {
          return json({ error: 'List not found' }, { status: 404 })
        }

        return json(updated)
      },
      DELETE: async ({ params, request }) => {
        const session = await auth.api.getSession({
          headers: request.headers,
        })

        if (!session?.user) {
          return json({ error: 'Unauthorized' }, { status: 401 })
        }

        const id = params._splat

        const deleted = await db.transaction(async (tx) => {
          // Delete list items first
          await tx
            .delete(shoppingListItem)
            .where(eq(shoppingListItem.shoppingListId, id))

          const [result] = await tx
            .delete(shoppingList)
            .where(and(eq(shoppingList.id, id), eq(shoppingList.userId, session.user.id)))
            .returning()

          return result
        })

        if (!deleted) {
          return json({ error: 'List not found' }, { status: 404 })
        }

        return json({ success: true })
      },
    },
  },
})
