import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
});

// Staff management (admin only)
export const createStaffSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['admin', 'salesperson']),
  phone: z.string().max(20).optional(),
});

export const updateStaffSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
  role: z.enum(['admin', 'salesperson']).optional(),
  phone: z.string().max(20).optional(),
  isActive: z.boolean().optional(),
});

export const resetStaffPasswordSchema = z.object({
  id: z.string().uuid(),
  newPassword: z.string().min(8),
});
