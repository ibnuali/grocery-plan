import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { db } from '#/db'
import { shoppingListItem, item, shoppingList, category } from '#/db/schema'
import { eq, and } from 'drizzle-orm'
import { requireAuth } from '#/lib/auth'
import { validateBody, quickAddListItemSchema } from '#/lib/validations'

export const Route = createFileRoute('/api/lists/items/add')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const session = await requireAuth(request)
        const body = validateBody(quickAddListItemSchema, await request.json())

        // Verify the list belongs to the user
        const [list] = await db
          .select()
          .from(shoppingList)
          .where(and(eq(shoppingList.id, body.shoppingListId), eq(shoppingList.userId, session.user.id)))

        if (!list) {
          return json({ error: 'List not found' }, { status: 404 })
        }

        const now = new Date()

        // Find or create a default "General" category for the user
        let categoryId: string
        const [existingCategory] = await db
          .select({ id: category.id })
          .from(category)
          .where(and(eq(category.userId, session.user.id), eq(category.name, 'General')))
          .limit(1)

        if (existingCategory) {
          categoryId = existingCategory.id
        } else {
          const [newCategory] = await db
            .insert(category)
            .values({
              id: crypto.randomUUID(),
              name: 'General',
              userId: session.user.id,
              createdAt: now,
              updatedAt: now,
            })
            .returning()
          categoryId = newCategory.id
        }

        // Create the item with estimatedPrice=0
        const [newItem] = await db
          .insert(item)
          .values({
            id: crypto.randomUUID(),
            name: body.name,
            categoryId,
            estimatedPrice: 0,
            userId: session.user.id,
            createdAt: now,
            updatedAt: now,
          })
          .returning()

        // Add item to the shopping list
        const [listItem] = await db
          .insert(shoppingListItem)
          .values({
            id: crypto.randomUUID(),
            shoppingListId: body.shoppingListId,
            itemId: newItem.id,
            quantity: body.quantity,
            unit: body.unit ?? null,
            notes: body.notes ?? null,
            createdAt: now,
          })
          .returning()

        return json(
          {
            id: listItem.id,
            itemId: newItem.id,
            quantity: listItem.quantity,
            unit: listItem.unit,
            notes: listItem.notes,
            itemName: newItem.name,
            estimatedPrice: newItem.estimatedPrice,
            createdAt: listItem.createdAt,
          },
          { status: 201 },
        )
      },
    },
  },
})
