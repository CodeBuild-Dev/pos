import type { Request } from 'express';
import rateLimit from 'express-rate-limit';

// tRPC batches calls into one URL (`/api/trpc/auth.login,user.me?batch=1`),
// so match on the procedure names in the path rather than the exact route.
const procedures = (req: Request) => req.path.replace(/^\//, '').split(',');

const AUTH_PROCEDURES = new Set([
  'auth.login',
  'auth.refreshToken',
  'auth.forgotPassword',
  'auth.resetPassword',
]);

/** Brute-force and email-spam protection for the public auth endpoints. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: (req) => !procedures(req).some((p) => AUTH_PROCEDURES.has(p)),
  message: { error: { message: 'Too many attempts. Please try again in 15 minutes.' } },
});

/** General per-IP ceiling for the rest of the API. */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { message: 'Too many requests. Please slow down.' } },
});
