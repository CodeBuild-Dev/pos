import { db } from '../db';
import { auditLog } from '../db/schema';

interface AuditLogParams {
  userId: string;
  userRole: string;
  action: string;
  entityType: string;
  entityId?: string;
  previousValue?: unknown;
  newValue?: unknown;
  ipAddress?: string;
  userAgent?: string;
}

export const auditService = {
  async log(params: AuditLogParams) {
    await db.insert(auditLog).values({
      userId: params.userId,
      userRole: params.userRole,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      previousValue: params.previousValue,
      newValue: params.newValue,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  },
};
