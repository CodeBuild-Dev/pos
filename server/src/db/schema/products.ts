import { pgTable, uuid, varchar, integer, boolean, timestamp } from 'drizzle-orm/pg-core';
import { categories } from './categories';

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  categoryId: uuid('category_id').references(() => categories.id).notNull(),
  price: integer('price').notNull(), // in paise
  stock: integer('stock').notNull().default(0),
  sku: varchar('sku', { length: 50 }).unique().notNull(),
  barcode: varchar('barcode', { length: 100 }).unique(),
  unit: varchar('unit', { length: 50 }).notNull().default('piece'),
  lowStockThreshold: integer('low_stock_threshold').notNull().default(20),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
