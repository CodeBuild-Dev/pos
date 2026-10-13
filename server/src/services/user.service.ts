import bcrypt from 'bcrypt';
import { eq, ne, desc } from 'drizzle-orm';
import { db } from '../db';
import { users } from '../db/schema';
import { auditService } from './audit.service';

const BCRYPT_ROUNDS = 12;

function omitPasswordHash(user: typeof users.$inferSelect) {
  const { passwordHash, ...rest } = user;
  return rest;
}

export const userService = {
  async getProfile(userId: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      throw new Error('User not found');
    }

    return omitPasswordHash(user);
  },

  async updateProfile(
    userId: string,
    data: { name?: string; email?: string; phone?: string },
  ) {
    const existing = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!existing) {
      throw new Error('User not found');
    }

    const [updated] = await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    await auditService.log({
      userId,
      userRole: existing.role,
      action: 'UPDATE_PROFILE',
      entityType: 'user',
      entityId: userId,
      previousValue: { name: existing.name, email: existing.email, phone: existing.phone },
      newValue: data,
    });

    return omitPasswordHash(updated);
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      throw new Error('User not found');
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      throw new Error('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, userId));

    await auditService.log({
      userId,
      userRole: user.role,
      action: 'CHANGE_PASSWORD',
      entityType: 'user',
      entityId: userId,
    });
  },

  // Staff management (admin only)
  async listStaff() {
    const allUsers = await db.query.users.findMany({
      orderBy: desc(users.createdAt),
    });
    return allUsers.map(omitPasswordHash);
  },

  async createStaff(
    data: { name: string; email: string; password: string; role: string; phone?: string },
    actorUserId: string,
    actorRole: string,
  ) {
    const existing = await db.query.users.findFirst({
      where: eq(users.email, data.email),
    });
    if (existing) {
      throw new Error('Email already in use');
    }

    const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
    const [user] = await db.insert(users).values({
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role,
      phone: data.phone,
    }).returning();

    await auditService.log({
      userId: actorUserId,
      userRole: actorRole,
      action: 'CREATE_STAFF',
      entityType: 'user',
      entityId: user.id,
      newValue: { name: data.name, email: data.email, role: data.role },
    });

    return omitPasswordHash(user);
  },

  async updateStaff(
    id: string,
    data: { name?: string; email?: string; role?: string; phone?: string; isActive?: boolean },
    actorUserId: string,
    actorRole: string,
  ) {
    const existing = await db.query.users.findFirst({
      where: eq(users.id, id),
    });
    if (!existing) {
      throw new Error('Staff member not found');
    }

    const [updated] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    await auditService.log({
      userId: actorUserId,
      userRole: actorRole,
      action: 'UPDATE_STAFF',
      entityType: 'user',
      entityId: id,
      previousValue: { name: existing.name, email: existing.email, role: existing.role, isActive: existing.isActive },
      newValue: data,
    });

    return omitPasswordHash(updated);
  },

  async resetStaffPassword(
    id: string,
    newPassword: string,
    actorUserId: string,
    actorRole: string,
  ) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    });
    if (!user) {
      throw new Error('Staff member not found');
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, id));

    await auditService.log({
      userId: actorUserId,
      userRole: actorRole,
      action: 'RESET_STAFF_PASSWORD',
      entityType: 'user',
      entityId: id,
    });
  },
};
