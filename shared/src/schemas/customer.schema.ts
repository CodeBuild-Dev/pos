import { z } from 'zod';

export const createCustomerSchema = z.object({
  name: z.string().min(1).max(255),
  phone: z.string().min(1).max(20),
  email: z.string().email().optional(),
});

export const listCustomersSchema = z.object({
  search: z.string().optional(),
});
