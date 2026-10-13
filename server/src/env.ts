import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load the repo-root .env (same file drizzle.config.ts and the seed use).
// Variables already set in the environment always win.
dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)) });

import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default('24h'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('30d'),
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_ORIGIN: z.string().default('*'),
  APP_URL: z.string().default('http://localhost:5173'),
  RESEND_API_KEY: z.string().default(''),
  RESEND_FROM_EMAIL: z.string().default('Shop POS <onboarding@resend.dev>'),
});

export const env = envSchema.parse(process.env);
