export type UserRole = 'admin' | 'salesperson';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** User without passwordHash — safe for client */
export type UserPublic = User;
