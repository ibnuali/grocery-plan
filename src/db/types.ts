import type { InferSelectModel } from 'drizzle-orm'
import * as schema from './schema.ts'

export type Category = InferSelectModel<typeof schema.category>
export type Item = InferSelectModel<typeof schema.item>
export type ShoppingList = InferSelectModel<typeof schema.shoppingList>
export type ShoppingListItem = InferSelectModel<typeof schema.shoppingListItem>
export type Purchase = InferSelectModel<typeof schema.purchase>
