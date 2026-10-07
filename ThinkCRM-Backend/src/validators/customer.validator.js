import { z } from 'zod';

export const createCustomerSchema = z.object({
  sourceLeadId: z.string().min(1, 'Source Lead ID is required'),
});

export const updateCustomerSchema = z.object({
  fullName: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  location: z.string().optional(),
});
