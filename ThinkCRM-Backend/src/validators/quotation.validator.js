import { z } from 'zod';

export const createQuotationSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  customerEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  quotationNumber: z.string().min(1, 'Quotation number is required'),
  amount: z.string().or(z.number()), // We will parse it to number in controller/service
  message: z.string().optional(),
});
