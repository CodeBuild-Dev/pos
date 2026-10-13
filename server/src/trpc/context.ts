import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { extractUser } from '../middleware/auth';
import { db } from '../db/index';
import type { UserRole } from '@shoppos/shared';

export interface ContextUser {
  userId: string;
  role: UserRole;
}

export interface Context {
  db: typeof db;
  user: ContextUser | null;
  req: CreateExpressContextOptions['req'];
  res: CreateExpressContextOptions['res'];
}

export async function createContext({ req, res }: CreateExpressContextOptions): Promise<Context> {
  const jwtPayload = extractUser(req.headers.authorization);

  const user = jwtPayload
    ? { userId: jwtPayload.userId, role: jwtPayload.role as UserRole }
    : null;

  return { db, user, req, res };
}
