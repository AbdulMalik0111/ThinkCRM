import { z } from 'zod';

export const createUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['Owner', 'Admin', 'Sales Manager', 'Sales Executive', 'Staff']).optional(),
  permissions: z.array(z.string()).optional(),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  role: z.enum(['Owner', 'Admin', 'Sales Manager', 'Sales Executive', 'Staff']).optional(),
  permissions: z.array(z.string()).optional(),
  status: z.enum(['active', 'disabled', 'suspended']).optional(),
  isActive: z.boolean().optional(),
});
