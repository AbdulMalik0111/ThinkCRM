import { z } from 'zod';

export const createMeasurementSchema = z.object({
  assignedTo: z.string().optional(),
  scheduledAt: z.string().optional(),
  notes: z.string().optional(),
  measurements: z.record(z.any()).optional(),
});

export const updateMeasurementSchema = z.object({
  assignedTo: z.string().optional(),
  scheduledAt: z.string().optional(),
  status: z.enum(['pending', 'scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
  notes: z.string().optional(),
  measurements: z.record(z.any()).optional(),
});
