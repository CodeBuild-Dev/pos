import { Resend } from 'resend';
import { env } from '../env';

// Email is optional: without an API key, reset links are logged instead of sent.
const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export const emailService = {
  async sendPasswordReset(to: string, name: string, resetUrl: string) {
    if (!resend) {
      console.log(`[DEV] Password reset link for ${to}: ${resetUrl}`);
      return;
    }

    await resend.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to,
      subject: 'Reset your Shop POS password',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-block; background: linear-gradient(135deg, #28BFA3, #20a090); width: 48px; height: 48px; border-radius: 12px; line-height: 48px; text-align: center;">
              <span style="color: white; font-size: 20px; font-weight: bold;">S</span>
            </div>
            <h1 style="margin: 16px 0 0; font-size: 24px; color: #1a1a2e;">Shop POS</h1>
          </div>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi ${name},</p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            We received a request to reset your password. Click the button below to create a new password.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #28BFA3, #20a090); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
              Reset Password
            </a>
          </div>
          <p style="color: #6B7280; font-size: 14px; line-height: 1.6;">
            This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 32px 0;" />
          <p style="color: #9CA3AF; font-size: 12px; text-align: center;">
            Shop POS — Shop Management Dashboard
          </p>
        </div>
      `,
    });
  },
};
