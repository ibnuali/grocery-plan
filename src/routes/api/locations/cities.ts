import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { db } from '#/db'
import { city } from '#/db/schema'
import { eq } from 'drizzle-orm'

export const Route = createFileRoute('/api/locations/cities')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const provinceId = url.searchParams.get('provinceId')

        if (!provinceId) {
          return json({ error: 'provinceId is required' }, { status: 400 })
        }

        const cities = await db
          .select()
          .from(city)
          .where(eq(city.provinceId, provinceId))

        return json({ cities })
      },
    },
  },
})
