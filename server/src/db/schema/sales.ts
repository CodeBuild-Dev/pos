import { pgTable, uuid, varchar, integer, text, timestamp } from 'drizzle-orm/pg-core';
import { customers } from './customers';
import { users } from './users';

export const sales = pgTable('sales', {
  id: uuid('id').primaryKey().defaultRandom(),
  transactionId: varchar('transaction_id', { length: 50 }).unique().notNull(),
  customerId: uuid('customer_id').references(() => customers.id),
  userId: uuid('user_id').references(() => users.id).notNull(),
  subtotal: integer('subtotal').notNull(), // in paise
  discount: integer('discount').notNull().default(0), // in paise
  total: integer('total').notNull(), // in paise
  paymentMethod: varchar('payment_method', { length: 20 }).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
