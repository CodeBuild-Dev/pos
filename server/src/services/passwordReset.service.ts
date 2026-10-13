import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { eq, and, gt } from 'drizzle-orm';
import { db } from '../db';
import { users, passwordResets } from '../db/schema';
import { emailService } from './email.service';
import { env } from '../env';

const BCRYPT_ROUNDS = 12;
const RESET_TOKEN_EXPIRY_HOURS = 1;

export const passwordResetService = {
  async requestReset(email: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    // Always return success to prevent email enumeration
    if (!user) return;

    // Delete any existing tokens for this user
    await db.delete(passwordResets).where(eq(passwordResets.userId, user.id));

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    await db.insert(passwordResets).values({
      userId: user.id,
      token,
      expiresAt,
    });

    // Send email
    const resetUrl = `${env.APP_URL}/reset-password?token=${token}`;
    await emailService.sendPasswordReset(user.email, user.name, resetUrl);
  },

  async resetPassword(token: string, newPassword: string) {
    const resetRecord = await db.query.passwordResets.findFirst({
      where: and(
        eq(passwordResets.token, token),
        gt(passwordResets.expiresAt, new Date()),
      ),
    });

    if (!resetRecord) {
      throw new Error('Invalid or expired reset link. Please request a new one.');
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, resetRecord.userId));

    // Delete used token
    await db.delete(passwordResets).where(eq(passwordResets.userId, resetRecord.userId));
  },
};
