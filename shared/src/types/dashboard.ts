export interface DashboardStats {
  todayRevenue: number; // paise
  todayTransactions: number;
  weeklyRevenue: number; // paise
  totalProducts: number;
  lowStockCount: number;
  activeCustomers: number;
  totalRevenue: number; // paise
  totalSales: number;
}

export interface DailySalesPoint {
  day: string;
  sales: number; // paise
}

export interface CategorySalesPoint {
  category: string;
  sales: number; // paise
  count: number;
}
