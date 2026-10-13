import { z } from 'zod';

export const createSaleSchema = z.object({
  customerId: z.string().uuid().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
  discount: z.number().int().min(0).default(0), // in paise
  paymentMethod: z.enum(['Cash', 'JazzCash', 'UPI']),
  notes: z.string().optional(),
});

export const listSalesSchema = z.object({
  search: z.string().optional(),
  paymentMethod: z.enum(['Cash', 'JazzCash', 'UPI']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});
