import { pgTable, text, timestamp, boolean, integer, index, check } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// Better Auth tables
export const user = pgTable('user', {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull(),
  emailVerified: boolean('email_verified').notNull(),
  username: text().notNull().unique(),
  displayUsername: text('display_username'),
  image: text(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
})

export const session = pgTable('session', {
  id: text().primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text().notNull().unique(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
})

export const account = pgTable('account', {
  id: text().primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text(),
  password: text(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
})

export const verification = pgTable('verification', {
  id: text().primaryKey(),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
})

// Grocery App Tables

export const category = pgTable('category', {
  id: text().primaryKey(),
  name: text().notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
}, (t) => [
  index('category_user_id_idx').on(t.userId),
])

export const item = pgTable('item', {
  id: text().primaryKey(),
  name: text().notNull(),
  categoryId: text('category_id')
    .notNull()
    .references(() => category.id, { onDelete: 'cascade' }),
  estimatedPrice: integer('estimated_price').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
}, (t) => [
  index('item_user_id_idx').on(t.userId),
  index('item_category_id_idx').on(t.categoryId),
  check('estimated_price_non_negative', sql`${t.estimatedPrice} >= 0`),
])

export const shoppingList = pgTable('shopping_list', {
  id: text().primaryKey(),
  name: text().notNull(),
  period: text('period').notNull(), // 'weekly' or 'monthly'
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
}, (t) => [
  index('shopping_list_user_id_idx').on(t.userId),
])

export const shoppingListItem = pgTable('shopping_list_item', {
  id: text().primaryKey(),
  shoppingListId: text('shopping_list_id')
    .notNull()
    .references(() => shoppingList.id, { onDelete: 'cascade' }),
  itemId: text('item_id')
    .notNull()
    .references(() => item.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull().default(1),
  createdAt: timestamp('created_at').notNull(),
}, (t) => [
  index('shopping_list_item_list_id_idx').on(t.shoppingListId),
  index('shopping_list_item_item_id_idx').on(t.itemId),
])

export const purchase = pgTable('purchase', {
  id: text().primaryKey(),
  shoppingListItemId: text('shopping_list_item_id')
    .notNull()
    .references(() => shoppingListItem.id, { onDelete: 'cascade' }),
  actualPrice: integer('actual_price').notNull(),
  purchasedAt: timestamp('purchased_at').notNull(),
  createdAt: timestamp('created_at').notNull(),
}, (t) => [
  index('purchase_shopping_list_item_id_idx').on(t.shoppingListItemId),
])
