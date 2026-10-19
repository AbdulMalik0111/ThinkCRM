import { z } from 'zod';

export const createQuotationSchema = z.object({
  customerName: z.string().trim().min(1, 'Customer name is required').max(100).optional(),
  customerEmail: z.string().trim().email('Invalid email address').optional().nullable().or(z.literal('')),
  quotationNumber: z.string().trim().min(1, 'Quotation number is required').max(50).optional(),
  amount: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val > 0, { message: 'Quotation amount must be a positive number' }),
  totalAmount: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => (val !== undefined && val !== null && val !== '' ? Number(val) : undefined))
    .refine((val) => val === undefined || (!isNaN(val) && val > 0), {
      message: 'Total amount must be a positive number',
    }),
  message: z.string().trim().max(3000).optional().nullable(),
  notes: z.string().trim().max(3000).optional().nullable(),
  validUntil: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || !isNaN(new Date(val).getTime()), {
      message: 'Valid until must be a valid date',
    }),
});
