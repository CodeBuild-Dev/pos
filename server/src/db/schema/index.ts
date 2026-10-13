import { relations } from 'drizzle-orm';
import { users } from './users';
import { categories } from './categories';
import { products } from './products';
import { customers } from './customers';
import { sales } from './sales';
import { saleItems } from './saleItems';
import { auditLog } from './auditLog';
import { passwordResets } from './passwordResets';

// Re-export all tables
export { users } from './users';
export { categories } from './categories';
export { products } from './products';
export { customers } from './customers';
export { sales } from './sales';
export { saleItems } from './saleItems';
export { auditLog } from './auditLog';
export { passwordResets } from './passwordResets';

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sales: many(sales),
  auditLogs: many(auditLog),
  passwordResets: many(passwordResets),
}));

export const passwordResetsRelations = relations(passwordResets, ({ one }) => ({
  user: one(users, {
    fields: [passwordResets.userId],
    references: [users.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  saleItems: many(saleItems),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  sales: many(sales),
}));

export const salesRelations = relations(sales, ({ one, many }) => ({
  customer: one(customers, {
    fields: [sales.customerId],
    references: [customers.id],
  }),
  user: one(users, {
    fields: [sales.userId],
    references: [users.id],
  }),
  items: many(saleItems),
}));

export const saleItemsRelations = relations(saleItems, ({ one }) => ({
  sale: one(sales, {
    fields: [saleItems.saleId],
    references: [sales.id],
  }),
  product: one(products, {
    fields: [saleItems.productId],
    references: [products.id],
  }),
}));

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  user: one(users, {
    fields: [auditLog.userId],
    references: [users.id],
  }),
}));
