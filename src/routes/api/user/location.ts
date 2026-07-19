import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { db } from '#/db'
import { user, province, city } from '#/db/schema'
import { eq } from 'drizzle-orm'
import { requireAuth } from '#/lib/auth'
import { validateBody, updateUserLocationSchema } from '#/lib/validations'

export const Route = createFileRoute('/api/user/location')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const session = await requireAuth(request)

        const [u] = await db
          .select({
            provinceId: user.provinceId,
            cityId: user.cityId,
          })
          .from(user)
          .where(eq(user.id, session.user.id))

        return json({ provinceId: u?.provinceId ?? null, cityId: u?.cityId ?? null })
      },
      PUT: async ({ request }) => {
        const session = await requireAuth(request)
        const body = validateBody(updateUserLocationSchema, await request.json())

        // Validate that province and city exist and city belongs to province
        if (body.provinceId) {
          const [prov] = await db
            .select()
            .from(province)
            .where(eq(province.id, body.provinceId))
          if (!prov) {
            return json({ error: 'Province not found' }, { status: 400 })
          }
        }

        if (body.cityId) {
          const [c] = await db
            .select()
            .from(city)
            .where(eq(city.id, body.cityId))
          if (!c) {
            return json({ error: 'City not found' }, { status: 400 })
          }
          if (body.provinceId && c.provinceId !== body.provinceId) {
            return json({ error: 'City does not belong to the selected province' }, { status: 400 })
          }
        }

        const [updated] = await db
          .update(user)
          .set({
            provinceId: body.provinceId || null,
            cityId: body.cityId || null,
            updatedAt: new Date(),
          })
          .where(eq(user.id, session.user.id))
          .returning({ provinceId: user.provinceId, cityId: user.cityId })

        return json(updated)
      },
    },
  },
})
