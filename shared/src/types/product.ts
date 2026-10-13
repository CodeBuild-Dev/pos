import type { Category } from './category';

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  price: number; // in paise
  stock: number;
  sku: string;
  barcode: string | null;
  unit: string;
  lowStockThreshold: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductWithCategory extends Product {
  category: Category;
}
