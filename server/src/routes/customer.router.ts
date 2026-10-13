import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { createCustomerSchema, listCustomersSchema } from '@shoppos/shared';
import { requireRole } from '../middleware/rbac';
import { customerService } from '../services/customer.service';

export const customerRouter = router({
  list: protectedProcedure.input(listCustomersSchema).query(async ({ input }) => {
    return customerService.list(input);
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      return customerService.getById(input.id);
    }),

  create: protectedProcedure.input(createCustomerSchema).mutation(async ({ ctx, input }) => {
    requireRole('admin', 'salesperson')(ctx.user.role);
    return customerService.create(input, ctx.user.userId, ctx.user.role);
  }),
});
