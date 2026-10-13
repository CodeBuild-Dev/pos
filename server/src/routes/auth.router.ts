import { router, publicProcedure } from '../trpc';
import { loginSchema, refreshTokenSchema, forgotPasswordSchema, resetPasswordSchema } from '@shoppos/shared';
import { authService } from '../services/auth.service';
import { passwordResetService } from '../services/passwordReset.service';

export const authRouter = router({
  login: publicProcedure.input(loginSchema).mutation(async ({ input }) => {
    return authService.login(input.email, input.password);
  }),

  refreshToken: publicProcedure.input(refreshTokenSchema).mutation(async ({ input }) => {
    return authService.refreshToken(input.refreshToken);
  }),

  forgotPassword: publicProcedure.input(forgotPasswordSchema).mutation(async ({ input }) => {
    await passwordResetService.requestReset(input.email);
    return { message: 'If an account exists with this email, a reset link has been sent.' };
  }),

  resetPassword: publicProcedure.input(resetPasswordSchema).mutation(async ({ input }) => {
    await passwordResetService.resetPassword(input.token, input.password);
    return { message: 'Password has been reset successfully.' };
  }),
});
