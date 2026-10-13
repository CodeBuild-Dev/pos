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
