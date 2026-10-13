import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  categoryId: z.string().uuid(),
  price: z.number().int().positive(),
  stock: z.number().int().min(0),
  sku: z.string().min(1).max(50),
  barcode: z.string().max(100).optional(),
  unit: z.enum(['piece', 'pack', 'set', 'box']),
  lowStockThreshold: z.number().int().min(0).default(20),
});

export const updateProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  categoryId: z.string().uuid().optional(),
  price: z.number().int().positive().optional(),
  stock: z.number().int().min(0).optional(),
  barcode: z.string().max(100).nullable().optional(),
  unit: z.enum(['piece', 'pack', 'set', 'box']).optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const listProductsSchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  lowStockOnly: z.boolean().optional(),
});
