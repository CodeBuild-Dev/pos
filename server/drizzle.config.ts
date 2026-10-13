import dotenv from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// Load .env from project root
dotenv.config({ path: '../.env' });

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: '../drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
