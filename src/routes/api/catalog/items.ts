import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { db } from '#/db'
import { globalItem, globalCategory } from '#/db/schema'
import { eq, and, ilike } from 'drizzle-orm'

export const Route = createFileRoute('/api/catalog/items')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const categoryId = url.searchParams.get('categoryId')
        const search = url.searchParams.get('search')

        const conditions = []

        if (categoryId) {
          conditions.push(eq(globalItem.globalCategoryId, categoryId))
        }

        if (search) {
          conditions.push(ilike(globalItem.name, `%${search}%`))
        }

        const query = db
          .select({
            id: globalItem.id,
            name: globalItem.name,
            unit: globalItem.unit,
            globalCategoryId: globalItem.globalCategoryId,
            categoryName: globalCategory.name,
          })
          .from(globalItem)
          .leftJoin(globalCategory, eq(globalItem.globalCategoryId, globalCategory.id))

        const items = conditions.length > 0
          ? await query.where(and(...conditions))
          : await query

        return json({ items })
      },
    },
  },
})
