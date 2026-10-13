import { router, protectedProcedure } from '../trpc';
import {
  updateProfileSchema,
  changePasswordSchema,
  createStaffSchema,
  updateStaffSchema,
  resetStaffPasswordSchema,
} from '@shoppos/shared';
import { requireRole } from '../middleware/rbac';
import { userService } from '../services/user.service';

export const userRouter = router({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    return userService.getProfile(ctx.user.userId);
  }),

  updateProfile: protectedProcedure
    .input(updateProfileSchema)
    .mutation(async ({ ctx, input }) => {
      return userService.updateProfile(ctx.user.userId, input);
    }),

  changePassword: protectedProcedure
    .input(changePasswordSchema)
    .mutation(async ({ ctx, input }) => {
      return userService.changePassword(ctx.user.userId, input.currentPassword, input.newPassword);
    }),

  // Staff management (admin only)
  listStaff: protectedProcedure.query(async ({ ctx }) => {
    requireRole('admin')(ctx.user.role);
    return userService.listStaff();
  }),

  createStaff: protectedProcedure
    .input(createStaffSchema)
    .mutation(async ({ ctx, input }) => {
      requireRole('admin')(ctx.user.role);
      return userService.createStaff(input, ctx.user.userId, ctx.user.role);
    }),

  updateStaff: protectedProcedure
    .input(updateStaffSchema)
    .mutation(async ({ ctx, input }) => {
      requireRole('admin')(ctx.user.role);
      const { id, ...data } = input;
      return userService.updateStaff(id, data, ctx.user.userId, ctx.user.role);
    }),

  resetStaffPassword: protectedProcedure
    .input(resetStaffPasswordSchema)
    .mutation(async ({ ctx, input }) => {
      requireRole('admin')(ctx.user.role);
      return userService.resetStaffPassword(input.id, input.newPassword, ctx.user.userId, ctx.user.role);
    }),
});
