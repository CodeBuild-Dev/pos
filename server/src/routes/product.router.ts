import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import {
  createProductSchema,
  updateProductSchema,
  listProductsSchema,
} from '@shoppos/shared';
import { requireRole } from '../middleware/rbac';
import { productService } from '../services/product.service';

export const productRouter = router({
  list: protectedProcedure.input(listProductsSchema).query(async ({ input }) => {
    return productService.list(input);
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      return productService.getById(input.id);
    }),

  getByBarcode: protectedProcedure
    .input(z.object({ barcode: z.string().min(1) }))
    .query(async ({ input }) => {
      return productService.getByBarcode(input.barcode);
    }),

  create: protectedProcedure.input(createProductSchema).mutation(async ({ ctx, input }) => {
    requireRole('admin', 'salesperson')(ctx.user.role);
    return productService.create(input, ctx.user.userId, ctx.user.role);
  }),

  update: protectedProcedure.input(updateProductSchema).mutation(async ({ ctx, input }) => {
    requireRole('admin')(ctx.user.role);
    const { id, ...data } = input;
    return productService.update(id, data, ctx.user.userId, ctx.user.role);
  }),
});
