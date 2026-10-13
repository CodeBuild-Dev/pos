import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { dashboardService } from '../services/dashboard.service';
import { chartFilterSchema } from '@shoppos/shared';

export const dashboardRouter = router({
  stats: protectedProcedure.query(async () => {
    return dashboardService.getStats();
  }),

  salesOverTime: protectedProcedure
    .input(chartFilterSchema)
    .query(async ({ input }) => {
      return dashboardService.getSalesOverTime(input.period);
    }),

  categorySales: protectedProcedure
    .input(chartFilterSchema)
    .query(async ({ input }) => {
      return dashboardService.getCategorySales(input.period);
    }),

  recentTransactions: protectedProcedure
    .input(z.object({ limit: z.number().default(4) }))
    .query(async ({ input }) => {
      return dashboardService.getRecentTransactions(input.limit);
    }),

  lowStockProducts: protectedProcedure.query(async () => {
    return dashboardService.getLowStockProducts();
  }),
});
