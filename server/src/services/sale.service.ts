import { eq, and, or, like, desc, gte, lte } from 'drizzle-orm';
import { db } from '../db';
import { sales, saleItems, products, customers, users } from '../db/schema';
import { auditService } from './audit.service';

interface SaleListInput {
  search?: string;
  paymentMethod?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface SaleCreateInput {
  customerId?: string;
  items: { productId: string; quantity: number }[];
  discount: number;
  paymentMethod: string;
  notes?: string;
}

function generateTransactionId(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = String(Math.floor(1000 + Math.random() * 9000));
  return `TXN-${y}${m}${d}-${rand}`;
}

export const saleService = {
  async list(input: SaleListInput = {}) {
    const conditions = [];

    if (input.search) {
      conditions.push(
        or(
          like(sales.transactionId, `%${input.search}%`),
          like(customers.name, `%${input.search}%`),
        ),
      );
    }

    if (input.paymentMethod) {
      conditions.push(eq(sales.paymentMethod, input.paymentMethod));
    }

    if (input.dateFrom) {
      conditions.push(gte(sales.createdAt, new Date(input.dateFrom)));
    }

    if (input.dateTo) {
      conditions.push(lte(sales.createdAt, new Date(input.dateTo)));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const result = await db
      .select({
        id: sales.id,
        transactionId: sales.transactionId,
        customerId: sales.customerId,
        userId: sales.userId,
        subtotal: sales.subtotal,
        discount: sales.discount,
        total: sales.total,
        paymentMethod: sales.paymentMethod,
        notes: sales.notes,
        createdAt: sales.createdAt,
        customerName: customers.name,
        customerPhone: customers.phone,
        userName: users.name,
      })
      .from(sales)
      .leftJoin(customers, eq(sales.customerId, customers.id))
      .innerJoin(users, eq(sales.userId, users.id))
      .where(where)
      .orderBy(desc(sales.createdAt));

    return result;
  },

  async getById(id: string) {
    const sale = await db.query.sales.findFirst({
      where: eq(sales.id, id),
      with: {
        items: {
          with: { product: true },
        },
        customer: true,
        user: true,
      },
    });

    if (!sale) {
      throw new Error('Sale not found');
    }

    return sale;
  },

  async create(input: SaleCreateInput, actorUserId: string, actorRole: string) {
    const transactionId = generateTransactionId();

    const result = await db.transaction(async (tx) => {
      // Resolve items: look up products, verify stock, compute line totals
      const resolvedItems: {
        productId: string;
        quantity: number;
        unitPrice: number;
        total: number;
        currentStock: number;
      }[] = [];

      for (const item of input.items) {
        const product = await tx.query.products.findFirst({
          where: eq(products.id, item.productId),
        });

        if (!product) {
          throw new Error(`Product not found: ${item.productId}`);
        }

        if (product.stock < item.quantity) {
          throw new Error(
            `Insufficient stock for "${product.name}": available ${product.stock}, requested ${item.quantity}`,
          );
        }

        resolvedItems.push({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: product.price,
          total: product.price * item.quantity,
          currentStock: product.stock,
        });
      }

      // Calculate totals
      const subtotal = resolvedItems.reduce((sum, i) => sum + i.total, 0);
      const total = subtotal - input.discount;

      // Insert sale record
      const [sale] = await tx
        .insert(sales)
        .values({
          transactionId,
          customerId: input.customerId,
          userId: actorUserId,
          subtotal,
          discount: input.discount,
          total,
          paymentMethod: input.paymentMethod,
          notes: input.notes,
        })
        .returning();

      // Insert sale items
      const itemRecords = resolvedItems.map((item) => ({
        saleId: sale.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
      }));

      await tx.insert(saleItems).values(itemRecords);

      // Decrement stock for each product
      for (const item of resolvedItems) {
        await tx
          .update(products)
          .set({ stock: item.currentStock - item.quantity, updatedAt: new Date() })
          .where(eq(products.id, item.productId));
      }

      return sale;
    });

    // Audit log (outside transaction - best effort)
    await auditService.log({
      userId: actorUserId,
      userRole: actorRole,
      action: 'CREATE_SALE',
      entityType: 'sale',
      entityId: result.id,
      newValue: {
        transactionId,
        items: input.items,
        discount: input.discount,
        paymentMethod: input.paymentMethod,
        total: result.total,
      },
    });

    // Return full sale with details
    return this.getById(result.id);
  },
};
