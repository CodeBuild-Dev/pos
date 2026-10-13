export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** With computed aggregates (computed on read, NEVER stored) */
export interface CustomerWithStats extends Customer {
  totalPurchases: number;
  totalSpent: number; // in paise
  lastVisit?: Date | null;
}
