import { eq } from 'drizzle-orm';
import { db } from '../db';
import { categories } from '../db/schema';
import { auditService } from './audit.service';

export const categoryService = {
  async list() {
    return db.query.categories.findMany({
      orderBy: (categories, { asc }) => [asc(categories.name)],
    });
  },

  async getById(id: string) {
    const category = await db.query.categories.findFirst({
      where: eq(categories.id, id),
    });

    if (!category) {
      throw new Error('Category not found');
    }

    return category;
  },

  async create(
    data: { name: string; skuPrefix: string; description?: string },
    actorUserId: string,
    actorRole: string,
  ) {
    const [category] = await db.insert(categories).values(data).returning();

    await auditService.log({
      userId: actorUserId,
      userRole: actorRole,
      action: 'CREATE_CATEGORY',
      entityType: 'category',
      entityId: category.id,
      newValue: data,
    });

    return category;
  },
};
