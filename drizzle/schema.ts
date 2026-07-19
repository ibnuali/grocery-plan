import { pgTable, text, timestamp, foreignKey, unique, boolean, index, check, integer } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const verification = pgTable("verification", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
});

export const account = pgTable("account", {
	id: text().primaryKey().notNull(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id").notNull(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at", { mode: 'string' }),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { mode: 'string' }),
	scope: text(),
	password: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "account_user_id_user_id_fk"
		}),
]);

export const session = pgTable("session", {
	id: text().primaryKey().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	token: text().notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "session_user_id_user_id_fk"
		}),
	unique("session_token_unique").on(table.token),
]);

export const user = pgTable("user", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: boolean("email_verified").notNull(),
	image: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	username: text().notNull(),
	displayUsername: text("display_username"),
	provinceId: text("province_id"),
	cityId: text("city_id"),
}, (table) => [
	foreignKey({
			columns: [table.provinceId],
			foreignColumns: [province.id],
			name: "user_province_id_province_id_fk"
		}),
	foreignKey({
			columns: [table.cityId],
			foreignColumns: [city.id],
			name: "user_city_id_city_id_fk"
		}),
	unique("user_username_unique").on(table.username),
]);

export const category = pgTable("category", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	userId: text("user_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	globalCategoryId: text("global_category_id"),
}, (table) => [
	index("category_global_category_id_idx").using("btree", table.globalCategoryId.asc().nullsLast().op("text_ops")),
	index("category_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "category_user_id_user_id_fk"
		}),
	foreignKey({
			columns: [table.globalCategoryId],
			foreignColumns: [globalCategory.id],
			name: "category_global_category_id_global_category_id_fk"
		}),
]);

export const item = pgTable("item", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	categoryId: text("category_id").notNull(),
	estimatedPrice: integer("estimated_price").notNull(),
	userId: text("user_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	globalItemId: text("global_item_id"),
}, (table) => [
	index("item_category_id_idx").using("btree", table.categoryId.asc().nullsLast().op("text_ops")),
	index("item_global_item_id_idx").using("btree", table.globalItemId.asc().nullsLast().op("text_ops")),
	index("item_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "item_user_id_user_id_fk"
		}),
	foreignKey({
			columns: [table.globalItemId],
			foreignColumns: [globalItem.id],
			name: "item_global_item_id_global_item_id_fk"
		}),
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [category.id],
			name: "item_category_id_category_id_fk"
		}).onDelete("cascade"),
	check("estimated_price_non_negative", sql`estimated_price >= 0`),
]);

export const purchase = pgTable("purchase", {
	id: text().primaryKey().notNull(),
	shoppingListItemId: text("shopping_list_item_id").notNull(),
	actualPrice: integer("actual_price").notNull(),
	purchasedAt: timestamp("purchased_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
}, (table) => [
	index("purchase_shopping_list_item_id_idx").using("btree", table.shoppingListItemId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.shoppingListItemId],
			foreignColumns: [shoppingListItem.id],
			name: "purchase_shopping_list_item_id_shopping_list_item_id_fk"
		}).onDelete("cascade"),
]);

export const shoppingList = pgTable("shopping_list", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	period: text().notNull(),
	startDate: timestamp("start_date", { mode: 'string' }).notNull(),
	endDate: timestamp("end_date", { mode: 'string' }).notNull(),
	userId: text("user_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	index("shopping_list_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "shopping_list_user_id_user_id_fk"
		}),
]);

export const shoppingListItem = pgTable("shopping_list_item", {
	id: text().primaryKey().notNull(),
	shoppingListId: text("shopping_list_id").notNull(),
	itemId: text("item_id").notNull(),
	quantity: integer().default(1).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	unit: text(),
	notes: text(),
	purchased: boolean().default(false).notNull(),
}, (table) => [
	index("shopping_list_item_item_id_idx").using("btree", table.itemId.asc().nullsLast().op("text_ops")),
	index("shopping_list_item_list_id_idx").using("btree", table.shoppingListId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.shoppingListId],
			foreignColumns: [shoppingList.id],
			name: "shopping_list_item_shopping_list_id_shopping_list_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.itemId],
			foreignColumns: [item.id],
			name: "shopping_list_item_item_id_item_id_fk"
		}).onDelete("cascade"),
]);

export const province = pgTable("province", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
});

export const city = pgTable("city", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	provinceId: text("province_id").notNull(),
}, (table) => [
	index("city_province_id_idx").using("btree", table.provinceId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.provinceId],
			foreignColumns: [province.id],
			name: "city_province_id_province_id_fk"
		}),
]);

export const globalCategory = pgTable("global_category", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
});

export const globalItem = pgTable("global_item", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	unit: text().notNull(),
	globalCategoryId: text("global_category_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	index("global_item_category_id_idx").using("btree", table.globalCategoryId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.globalCategoryId],
			foreignColumns: [globalCategory.id],
			name: "global_item_global_category_id_global_category_id_fk"
		}),
]);

export const globalPrice = pgTable("global_price", {
	id: text().primaryKey().notNull(),
	globalItemId: text("global_item_id").notNull(),
	cityId: text("city_id").notNull(),
	price: integer().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	index("global_price_city_id_idx").using("btree", table.cityId.asc().nullsLast().op("text_ops")),
	index("global_price_item_city_idx").using("btree", table.globalItemId.asc().nullsLast().op("text_ops"), table.cityId.asc().nullsLast().op("text_ops")),
	index("global_price_item_id_idx").using("btree", table.globalItemId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.globalItemId],
			foreignColumns: [globalItem.id],
			name: "global_price_global_item_id_global_item_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.cityId],
			foreignColumns: [city.id],
			name: "global_price_city_id_city_id_fk"
		}),
	check("global_price_non_negative", sql`price >= 0`),
]);
