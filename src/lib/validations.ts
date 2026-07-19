import { z } from 'zod'
import { json } from '@tanstack/react-start'

export function validateBody<T extends z.ZodType>(schema: T, body: unknown): z.infer<T> {
  const result = schema.safeParse(body)
  if (!result.success) {
    const message = result.error.issues.map((e: { message: string }) => e.message).join(', ')
    throw json({ error: message }, { status: 400 })
  }
  return result.data
}

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  globalCategoryId: z.string().optional(),
})

export const updateCategorySchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
})

export const createItemSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  categoryId: z.string().min(1, 'Category is required'),
  estimatedPrice: z.number().int().nonnegative('Price must be non-negative'),
  globalItemId: z.string().optional(),
  cityId: z.string().optional(),
})

export const updateItemSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  categoryId: z.string().min(1, 'Category is required'),
  estimatedPrice: z.number().int().nonnegative('Price must be non-negative'),
  globalItemId: z.string().optional(),
  cityId: z.string().optional(),
})

export const createListSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  period: z.enum(['weekly', 'monthly']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
}).refine(d => new Date(d.endDate) > new Date(d.startDate), {
  message: 'End date must be after start date',
  path: ['endDate'],
})

export const updateListSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  period: z.enum(['weekly', 'monthly']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
}).refine(d => new Date(d.endDate) > new Date(d.startDate), {
  message: 'End date must be after start date',
  path: ['endDate'],
})

export const addListItemSchema = z.object({
  shoppingListId: z.string().min(1, 'shoppingListId is required'),
  itemId: z.string().min(1, 'itemId is required'),
  quantity: z.number().int().positive().default(1),
})

export const deleteListItemSchema = z.object({
  id: z.string().min(1, 'id is required'),
})

export const createPurchaseSchema = z.object({
  shoppingListItemId: z.string().min(1, 'shoppingListItemId is required'),
  actualPrice: z.number().int().nonnegative('Price must be non-negative'),
})

export const updateUserLocationSchema = z.object({
  provinceId: z.string().nullable().optional(),
  cityId: z.string().nullable().optional(),
})
