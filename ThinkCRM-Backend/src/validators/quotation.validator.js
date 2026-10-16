import { z } from 'zod';

export const createQuotationSchema = z.object({
  customerName: z.string().optional(),
  customerEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  quotationNumber: z.string().optional(),
  amount: z.string().or(z.number()).optional(),
  totalAmount: z.string().or(z.number()).optional(),
  message: z.string().optional(),
  notes: z.string().optional(),
  validUntil: z.string().optional(),
});
