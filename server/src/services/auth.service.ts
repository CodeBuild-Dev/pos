import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users } from '../db/schema';
import { generateAccessToken, generateRefreshToken } from '../middleware/auth';
import { env } from '../env';

function omitPasswordHash(user: typeof users.$inferSelect) {
  const { passwordHash, ...rest } = user;
  return rest;
}

export const authService = {
  async login(email: string, password: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    // Check the password before the account status, so a stranger can't
    // learn which emails exist.
    const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;
    if (!user || !valid) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Account is deactivated' });
    }

    const tokenPayload = { userId: user.id, role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    return {
      user: omitPasswordHash(user),
      accessToken,
      refreshToken,
    };
  },

  async refreshToken(token: string) {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as {
        userId: string;
        role: string;
      };

      const user = await db.query.users.findFirst({
        where: eq(users.id, decoded.userId),
      });

      if (!user || !user.isActive) {
        throw new Error('User not found or deactivated');
      }

      const accessToken = generateAccessToken({
        userId: user.id,
        role: user.role,
      });

      return { accessToken };
    } catch {
      throw new Error('Invalid or expired refresh token');
    }
  },
};
