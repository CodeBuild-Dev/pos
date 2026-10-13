export interface Category {
  id: string;
  name: string;
  description?: string | null;
  skuPrefix: string;
  createdAt: Date;
  updatedAt: Date;
}
