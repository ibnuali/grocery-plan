import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { db } from '#/db'
import { globalPrice, globalItem, city } from '#/db/schema'
import { eq, and } from 'drizzle-orm'

export const Route = createFileRoute('/api/catalog/price')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const globalItemId = url.searchParams.get('globalItemId')
        const cityId = url.searchParams.get('cityId')

        if (!globalItemId || !cityId) {
          return json(
            { error: 'globalItemId and cityId are required' },
            { status: 400 },
          )
        }

        const [price] = await db
          .select({
            id: globalPrice.id,
            globalItemId: globalPrice.globalItemId,
            cityId: globalPrice.cityId,
            price: globalPrice.price,
            itemName: globalItem.name,
            cityName: city.name,
          })
          .from(globalPrice)
          .leftJoin(globalItem, eq(globalPrice.globalItemId, globalItem.id))
          .leftJoin(city, eq(globalPrice.cityId, city.id))
          .where(
            and(
              eq(globalPrice.globalItemId, globalItemId),
              eq(globalPrice.cityId, cityId),
            ),
          )

        if (!price) {
          return json({ error: 'Price not found' }, { status: 404 })
        }

        return json({ price })
      },
    },
  },
})
