import { eq, sql, lt, desc } from 'drizzle-orm';
import { db } from '../db';
import { sales, saleItems, products, categories, customers } from '../db/schema';
import type { ChartPeriod } from '@shoppos/shared';

function periodConfig(period: ChartPeriod) {
  switch (period) {
    case '1d':  return { interval: '1 day',   format: 'HH12 AM', groupExpr: sql`date_trunc('hour', ${sales.createdAt})` };
    case '3d':  return { interval: '3 days',  format: 'Dy',      groupExpr: sql`${sales.createdAt}::date` };
    case '7d':  return { interval: '7 days',  format: 'Dy',      groupExpr: sql`${sales.createdAt}::date` };
    case '30d': return { interval: '30 days', format: 'DD Mon',  groupExpr: sql`${sales.createdAt}::date` };
    case '1y':  return { interval: '1 year',  format: 'Mon',     groupExpr: sql`date_trunc('month', ${sales.createdAt})` };
  }
}

export const dashboardService = {
  async getStats() {
    const [todayStats] = await db
      .select({
        revenue: sql<number>`cast(coalesce(sum(${sales.total}), 0) as int)`,
        transactions: sql<number>`cast(count(${sales.id}) as int)`,
      })
      .from(sales)
      .where(sql`${sales.createdAt}::date = CURRENT_DATE`);

    const [weeklyStats] = await db
      .select({
        revenue: sql<number>`cast(coalesce(sum(${sales.total}), 0) as int)`,
      })
      .from(sales)
      .where(sql`${sales.createdAt}::date >= CURRENT_DATE - interval '7 days'`);

    const [productStats] = await db
      .select({
        totalProducts: sql<number>`cast(count(*) as int)`,
        lowStockCount: sql<number>`cast(count(*) filter (where ${products.stock} < ${products.lowStockThreshold}) as int)`,
      })
      .from(products)
      .where(eq(products.isActive, true));

    const [customerStats] = await db
      .select({
        activeCustomers: sql<number>`cast(count(*) as int)`,
      })
      .from(customers)
      .where(eq(customers.isActive, true));

    const [allTimeStats] = await db
      .select({
        totalRevenue: sql<number>`cast(coalesce(sum(${sales.total}), 0) as bigint)`,
        totalSales: sql<number>`cast(count(${sales.id}) as int)`,
      })
      .from(sales);

    return {
      todayRevenue: todayStats.revenue,
      todayTransactions: todayStats.transactions,
      weeklyRevenue: weeklyStats.revenue,
      totalProducts: productStats.totalProducts,
      lowStockCount: productStats.lowStockCount,
      activeCustomers: customerStats.activeCustomers,
      totalRevenue: allTimeStats.totalRevenue,
      totalSales: allTimeStats.totalSales,
    };
  },

  async getSalesOverTime(period: ChartPeriod = '7d') {
    const { interval, format, groupExpr } = periodConfig(period);

    const result = await db
      .select({
        day: sql<string>`to_char(${groupExpr}, ${format})`,
        sales: sql<number>`cast(coalesce(sum(${sales.total}), 0) as int)`,
      })
      .from(sales)
      .where(sql`${sales.createdAt} >= now() - ${interval}::interval`)
      .groupBy(groupExpr)
      .orderBy(groupExpr);

    return result;
  },

  async getCategorySales(period: ChartPeriod = '7d') {
    const { interval } = periodConfig(period);

    const result = await db
      .select({
        category: categories.name,
        sales: sql<number>`cast(coalesce(sum(${saleItems.total}), 0) as int)`,
        count: sql<number>`cast(count(${saleItems.id}) as int)`,
      })
      .from(saleItems)
      .innerJoin(sales, eq(saleItems.saleId, sales.id))
      .innerJoin(products, eq(saleItems.productId, products.id))
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(sql`${sales.createdAt} >= now() - ${interval}::interval`)
      .groupBy(categories.id, categories.name)
      .orderBy(sql`sum(${saleItems.total}) desc`);

    return result;
  },

  async getRecentTransactions(limit: number = 10) {
    const result = await db
      .select({
        id: sales.id,
        transactionId: sales.transactionId,
        total: sales.total,
        paymentMethod: sales.paymentMethod,
        createdAt: sales.createdAt,
        customerName: customers.name,
      })
      .from(sales)
      .leftJoin(customers, eq(sales.customerId, customers.id))
      .orderBy(desc(sales.createdAt))
      .limit(limit);

    return result;
  },

  async getLowStockProducts() {
    return db.query.products.findMany({
      where: lt(products.stock, products.lowStockThreshold),
      with: { category: true },
      orderBy: (products, { asc }) => [asc(products.stock)],
    });
  },
};
