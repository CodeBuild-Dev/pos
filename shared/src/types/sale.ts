import type { Product } from './product';
import type { Customer } from './customer';
import type { UserPublic } from './user';

export type PaymentMethod = 'Cash' | 'JazzCash' | 'UPI';

export interface Sale {
  id: string;
  transactionId: string;
  customerId?: string | null;
  userId: string;
  subtotal: number; // in paise
  discount: number; // in paise
  total: number; // in paise
  paymentMethod: PaymentMethod;
  notes?: string | null;
  createdAt: Date;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  quantity: number;
  unitPrice: number; // in paise
  total: number; // in paise
}

export interface SaleItemWithProduct extends SaleItem {
  product: Product;
}

export interface SaleWithDetails extends Sale {
  items: SaleItemWithProduct[];
  customer?: Customer | null;
  user: UserPublic;
}
