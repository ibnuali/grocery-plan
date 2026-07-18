import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { db } from '#/db'
import { shoppingList } from '#/db/schema'
import { eq, and } from 'drizzle-orm'
import { requireAuth } from '#/lib/auth'
import { validateBody, updateListSchema } from '#/lib/validations'

export const Route = createFileRoute('/api/lists/$')({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const session = await requireAuth(request)

        const id = params._splat!

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
        const session = await requireAuth(request)
        const id = params._splat!
        const body = validateBody(updateListSchema, await request.json())

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
        const session = await requireAuth(request)

        const id = params._splat!

        const [deleted] = await db
          .delete(shoppingList)
          .where(and(eq(shoppingList.id, id), eq(shoppingList.userId, session.user.id)))
          .returning()

        if (!deleted) {
          return json({ error: 'List not found' }, { status: 404 })
        }

        return json({ success: true })
      },
    },
  },
})
