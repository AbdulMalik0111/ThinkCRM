import { z } from 'zod';

export const createMeasurementSchema = z.object({
  assignedTo: z.string().optional().nullable(),
  scheduledAt: z
    .string({ required_error: 'Scheduled date and time is required' })
    .min(1, 'Scheduled date and time is required')
    .refine((val) => !isNaN(new Date(val).getTime()), {
      message: 'Please provide a valid calendar date and time',
    }),
  notes: z.string().trim().max(3000).optional().nullable(),
  measurements: z.record(z.any()).optional(),
});

export const updateMeasurementSchema = z.object({
  assignedTo: z.string().optional().nullable(),
  scheduledAt: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(new Date(val).getTime()), {
      message: 'Please provide a valid calendar date and time',
    }),
  status: z.enum(['pending', 'scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
  notes: z.string().trim().max(3000).optional().nullable(),
  measurements: z.record(z.any()).optional(),
});
