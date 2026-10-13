import { eq, like, sql } from 'drizzle-orm';
import { db } from '../db';
import { customers, sales } from '../db/schema';
import { auditService } from './audit.service';

interface CustomerListInput {
  search?: string;
}

export const customerService = {
  async list(input: CustomerListInput = {}) {
    const where = input.search
      ? like(customers.name, `%${input.search}%`)
      : undefined;

    const result = await db
      .select({
        id: customers.id,
        name: customers.name,
        phone: customers.phone,
        email: customers.email,
        isActive: customers.isActive,
        createdAt: customers.createdAt,
        updatedAt: customers.updatedAt,
        totalPurchases: sql<number>`cast(count(${sales.id}) as int)`,
        totalSpent: sql<number>`cast(coalesce(sum(${sales.total}), 0) as int)`,
        lastVisit: sql<string>`max(${sales.createdAt})`,
      })
      .from(customers)
      .leftJoin(sales, eq(customers.id, sales.customerId))
      .where(where)
      .groupBy(customers.id)
      .orderBy(customers.name);

    return result;
  },

  async getById(id: string) {
    const result = await db
      .select({
        id: customers.id,
        name: customers.name,
        phone: customers.phone,
        email: customers.email,
        isActive: customers.isActive,
        createdAt: customers.createdAt,
        updatedAt: customers.updatedAt,
        totalPurchases: sql<number>`cast(count(${sales.id}) as int)`,
        totalSpent: sql<number>`cast(coalesce(sum(${sales.total}), 0) as int)`,
        lastVisit: sql<string>`max(${sales.createdAt})`,
      })
      .from(customers)
      .leftJoin(sales, eq(customers.id, sales.customerId))
      .where(eq(customers.id, id))
      .groupBy(customers.id);

    if (result.length === 0) {
      throw new Error('Customer not found');
    }

    return result[0];
  },

  async create(
    data: { name: string; phone: string; email?: string },
    actorUserId: string,
    actorRole: string,
  ) {
    const [customer] = await db.insert(customers).values(data).returning();

    await auditService.log({
      userId: actorUserId,
      userRole: actorRole,
      action: 'CREATE_CUSTOMER',
      entityType: 'customer',
      entityId: customer.id,
      newValue: data,
    });

    return customer;
  },
};
