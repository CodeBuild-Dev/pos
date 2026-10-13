import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { requireRole } from '../middleware/rbac';
import { categoryService } from '../services/category.service';

export const categoryRouter = router({
  list: protectedProcedure.query(async () => {
    return categoryService.list();
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        skuPrefix: z.string().min(1).max(10),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requireRole('admin')(ctx.user.role);
      return categoryService.create(input, ctx.user.userId, ctx.user.role);
    }),
});
