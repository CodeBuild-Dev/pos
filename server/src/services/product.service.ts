import { eq, or, and, like, lt } from 'drizzle-orm';
import { db } from '../db';
import { products } from '../db/schema';
import { auditService } from './audit.service';

interface ProductListInput {
  search?: string;
  categoryId?: string;
  lowStockOnly?: boolean;
}

export const productService = {
  async list(input: ProductListInput = {}) {
    const conditions = [];

    if (input.search) {
      conditions.push(
        or(
          like(products.name, `%${input.search}%`),
          like(products.sku, `%${input.search}%`),
          like(products.barcode, `%${input.search}%`),
        ),
      );
    }

    if (input.categoryId) {
      conditions.push(eq(products.categoryId, input.categoryId));
    }

    if (input.lowStockOnly) {
      conditions.push(lt(products.stock, products.lowStockThreshold));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    return db.query.products.findMany({
      where,
      with: { category: true },
      orderBy: (products, { desc }) => [desc(products.createdAt)],
    });
  },

  async getById(id: string) {
    const product = await db.query.products.findFirst({
      where: eq(products.id, id),
      with: { category: true },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    return product;
  },

  async getByBarcode(barcode: string) {
    const product = await db.query.products.findFirst({
      where: or(eq(products.barcode, barcode), eq(products.sku, barcode)),
      with: { category: true },
    });

    return product || null;
  },

  async create(
    data: {
      name: string;
      categoryId: string;
      price: number;
      stock: number;
      sku: string;
      barcode?: string;
      unit?: string;
      lowStockThreshold?: number;
    },
    actorUserId: string,
    actorRole: string,
  ) {
    const [product] = await db.insert(products).values(data).returning();

    await auditService.log({
      userId: actorUserId,
      userRole: actorRole,
      action: 'CREATE_PRODUCT',
      entityType: 'product',
      entityId: product.id,
      newValue: data,
    });

    return product;
  },

  async update(
    id: string,
    data: {
      name?: string;
      categoryId?: string;
      price?: number;
      stock?: number;
      sku?: string;
      barcode?: string | null;
      unit?: string;
      lowStockThreshold?: number;
      isActive?: boolean;
    },
    actorUserId: string,
    actorRole: string,
  ) {
    const existing = await db.query.products.findFirst({
      where: eq(products.id, id),
    });

    if (!existing) {
      throw new Error('Product not found');
    }

    const [updated] = await db
      .update(products)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();

    await auditService.log({
      userId: actorUserId,
      userRole: actorRole,
      action: 'UPDATE_PRODUCT',
      entityType: 'product',
      entityId: id,
      previousValue: existing,
      newValue: data,
    });

    return updated;
  },

  async updateStock(id: string, newStock: number) {
    const [updated] = await db
      .update(products)
      .set({ stock: newStock, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();

    if (!updated) {
      throw new Error('Product not found');
    }

    return updated;
  },
};
