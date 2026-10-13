import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../env';
import type { JWTPayload } from '@shoppos/shared';

export function extractUser(authHeader?: string): JWTPayload | null {
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  try {
    return jwt.verify(token, env.JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export function generateAccessToken(payload: { userId: string; role: string }): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'] });
}

export function generateRefreshToken(payload: { userId: string; role: string }): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.REFRESH_TOKEN_EXPIRES_IN as SignOptions['expiresIn'] });
}
