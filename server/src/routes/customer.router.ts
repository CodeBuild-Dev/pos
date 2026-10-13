import { router, protectedProcedure } from '../trpc';
import { createCustomerSchema, listCustomersSchema } from '@shoppos/shared';
import { requireRole } from '../middleware/rbac';
import { customerService } from '../services/customer.service';

export const customerRouter = router({
  list: protectedProcedure.input(listCustomersSchema).query(async ({ input }) => {
    return customerService.list(input);
  }),

  create: protectedProcedure.input(createCustomerSchema).mutation(async ({ ctx, input }) => {
    requireRole('admin', 'salesperson')(ctx.user.role);
    return customerService.create(input, ctx.user.userId, ctx.user.role);
  }),
});
