import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { createSaleSchema, listSalesSchema } from '@shoppos/shared';
import { requireRole } from '../middleware/rbac';
import { saleService } from '../services/sale.service';

export const saleRouter = router({
  list: protectedProcedure.input(listSalesSchema).query(async ({ input }) => {
    return saleService.list(input);
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      return saleService.getById(input.id);
    }),

  create: protectedProcedure.input(createSaleSchema).mutation(async ({ ctx, input }) => {
    requireRole('admin', 'salesperson')(ctx.user.role);
    return saleService.create(input, ctx.user.userId, ctx.user.role);
  }),
});
