import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { db } from '#/db'
import { globalCategory } from '#/db/schema'

export const Route = createFileRoute('/api/catalog/categories')({
  server: {
    handlers: {
      GET: async () => {
        const categories = await db
          .select({
            id: globalCategory.id,
            name: globalCategory.name,
          })
          .from(globalCategory)

        return json({ categories })
      },
    },
  },
})
