import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  index,
  check,
} from 'drizzle-orm/pg-core'
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
  provinceId: text('province_id').references(() => province.id),
  cityId: text('city_id').references(() => city.id),
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

export const category = pgTable(
  'category',
  {
    id: text().primaryKey(),
    name: text().notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id),
    globalCategoryId: text('global_category_id').references(
      () => globalCategory.id,
    ),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
  },
  (t) => [
    index('category_user_id_idx').on(t.userId),
    index('category_global_category_id_idx').on(t.globalCategoryId),
  ],
)

export const item = pgTable(
  'item',
  {
    id: text().primaryKey(),
    name: text().notNull(),
    categoryId: text('category_id')
      .notNull()
      .references(() => category.id, { onDelete: 'cascade' }),
    estimatedPrice: integer('estimated_price').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id),
    globalItemId: text('global_item_id').references(() => globalItem.id),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
  },
  (t) => [
    index('item_user_id_idx').on(t.userId),
    index('item_category_id_idx').on(t.categoryId),
    index('item_global_item_id_idx').on(t.globalItemId),
    check('estimated_price_non_negative', sql`${t.estimatedPrice} >= 0`),
  ],
)

// Global Catalog Tables

export const province = pgTable('province', {
  id: text().primaryKey(),
  name: text().notNull(),
})

export const city = pgTable(
  'city',
  {
    id: text().primaryKey(),
    name: text().notNull(),
    provinceId: text('province_id')
      .notNull()
      .references(() => province.id),
  },
  (t) => [index('city_province_id_idx').on(t.provinceId)],
)

export const globalCategory = pgTable('global_category', {
  id: text().primaryKey(),
  name: text().notNull(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
})

export const globalItem = pgTable(
  'global_item',
  {
    id: text().primaryKey(),
    name: text().notNull(),
    unit: text().notNull(), // e.g. 'kg', 'pcs', 'pack', 'litre'
    globalCategoryId: text('global_category_id')
      .notNull()
      .references(() => globalCategory.id),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
  },
  (t) => [index('global_item_category_id_idx').on(t.globalCategoryId)],
)

export const globalPrice = pgTable(
  'global_price',
  {
    id: text().primaryKey(),
    globalItemId: text('global_item_id')
      .notNull()
      .references(() => globalItem.id, { onDelete: 'cascade' }),
    cityId: text('city_id')
      .notNull()
      .references(() => city.id),
    price: integer().notNull(),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
  },
  (t) => [
    index('global_price_item_id_idx').on(t.globalItemId),
    index('global_price_city_id_idx').on(t.cityId),
    index('global_price_item_city_idx').on(t.globalItemId, t.cityId),
    check('global_price_non_negative', sql`${t.price} >= 0`),
  ],
)

export const shoppingList = pgTable(
  'shopping_list',
  {
    id: text().primaryKey(),
    name: text().notNull(),
    period: text('period').notNull(), // 'weekly' or 'monthly'
    date: timestamp('date').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
  },
  (t) => [index('shopping_list_user_id_idx').on(t.userId)],
)

export const shoppingListItem = pgTable(
  'shopping_list_item',
  {
    id: text().primaryKey(),
    shoppingListId: text('shopping_list_id')
      .notNull()
      .references(() => shoppingList.id, { onDelete: 'cascade' }),
    itemId: text('item_id')
      .notNull()
      .references(() => item.id, { onDelete: 'cascade' }),
    quantity: integer('quantity').notNull().default(1),
    unit: text('unit'),
    notes: text('notes'),
    purchased: boolean('purchased').notNull().default(false),
    createdAt: timestamp('created_at').notNull(),
  },
  (t) => [
    index('shopping_list_item_list_id_idx').on(t.shoppingListId),
    index('shopping_list_item_item_id_idx').on(t.itemId),
  ],
)

export const purchase = pgTable(
  'purchase',
  {
    id: text().primaryKey(),
    shoppingListItemId: text('shopping_list_item_id')
      .notNull()
      .references(() => shoppingListItem.id, { onDelete: 'cascade' }),
    actualPrice: integer('actual_price').notNull(),
    purchasedAt: timestamp('purchased_at').notNull(),
    createdAt: timestamp('created_at').notNull(),
  },
  (t) => [index('purchase_shopping_list_item_id_idx').on(t.shoppingListItemId)],
)
