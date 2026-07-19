import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { db } from '#/db'
import { province } from '#/db/schema'

export const Route = createFileRoute('/api/locations/provinces')({
  server: {
    handlers: {
      GET: async () => {
        const provinces = await db.select().from(province)
        return json({ provinces })
      },
    },
  },
})
