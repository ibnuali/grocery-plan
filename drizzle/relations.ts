import { relations } from "drizzle-orm/relations";
import { user, account, session, province, city, category, globalCategory, item, globalItem, shoppingListItem, purchase, shoppingList, globalPrice } from "./schema";

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({one, many}) => ({
	accounts: many(account),
	sessions: many(session),
	province: one(province, {
		fields: [user.provinceId],
		references: [province.id]
	}),
	city: one(city, {
		fields: [user.cityId],
		references: [city.id]
	}),
	categories: many(category),
	items: many(item),
	shoppingLists: many(shoppingList),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const provinceRelations = relations(province, ({many}) => ({
	users: many(user),
	cities: many(city),
}));

export const cityRelations = relations(city, ({one, many}) => ({
	users: many(user),
	province: one(province, {
		fields: [city.provinceId],
		references: [province.id]
	}),
	globalPrices: many(globalPrice),
}));

export const categoryRelations = relations(category, ({one, many}) => ({
	user: one(user, {
		fields: [category.userId],
		references: [user.id]
	}),
	globalCategory: one(globalCategory, {
		fields: [category.globalCategoryId],
		references: [globalCategory.id]
	}),
	items: many(item),
}));

export const globalCategoryRelations = relations(globalCategory, ({many}) => ({
	categories: many(category),
	globalItems: many(globalItem),
}));

export const itemRelations = relations(item, ({one, many}) => ({
	user: one(user, {
		fields: [item.userId],
		references: [user.id]
	}),
	globalItem: one(globalItem, {
		fields: [item.globalItemId],
		references: [globalItem.id]
	}),
	category: one(category, {
		fields: [item.categoryId],
		references: [category.id]
	}),
	shoppingListItems: many(shoppingListItem),
}));

export const globalItemRelations = relations(globalItem, ({one, many}) => ({
	items: many(item),
	globalCategory: one(globalCategory, {
		fields: [globalItem.globalCategoryId],
		references: [globalCategory.id]
	}),
	globalPrices: many(globalPrice),
}));

export const purchaseRelations = relations(purchase, ({one}) => ({
	shoppingListItem: one(shoppingListItem, {
		fields: [purchase.shoppingListItemId],
		references: [shoppingListItem.id]
	}),
}));

export const shoppingListItemRelations = relations(shoppingListItem, ({one, many}) => ({
	purchases: many(purchase),
	shoppingList: one(shoppingList, {
		fields: [shoppingListItem.shoppingListId],
		references: [shoppingList.id]
	}),
	item: one(item, {
		fields: [shoppingListItem.itemId],
		references: [item.id]
	}),
}));

export const shoppingListRelations = relations(shoppingList, ({one, many}) => ({
	user: one(user, {
		fields: [shoppingList.userId],
		references: [user.id]
	}),
	shoppingListItems: many(shoppingListItem),
}));

export const globalPriceRelations = relations(globalPrice, ({one}) => ({
	globalItem: one(globalItem, {
		fields: [globalPrice.globalItemId],
		references: [globalItem.id]
	}),
	city: one(city, {
		fields: [globalPrice.cityId],
		references: [city.id]
	}),
}));