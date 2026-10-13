import { TRPCError } from '@trpc/server';
import type { UserRole } from '@shoppos/shared';

export function requireRole(...roles: UserRole[]) {
  return (userRole: UserRole) => {
    if (!roles.includes(userRole)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Insufficient permissions',
      });
    }
  };
}
