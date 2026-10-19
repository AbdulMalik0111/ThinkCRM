import { z } from 'zod';

const followUpTypeEnum = z.enum(
  ['call', 'whatsapp', 'email', 'site_visit', 'meeting', 'measurement', 'quotation', 'quotation_followup', 'other'],
  { errorMap: () => ({ message: 'Please select a valid follow-up type' }) }
);

const priorityEnum = z.enum(['low', 'medium', 'high', 'urgent'], {
  errorMap: () => ({ message: 'Please select a valid priority' }),
});

export const createFollowUpSchema = z.object({
  assignedTo: z.string().optional().nullable(),
  leadId: z.string().optional().nullable(),
  type: followUpTypeEnum,
  scheduledAt: z
    .string({ required_error: 'Scheduled date and time is required' })
    .min(1, 'Scheduled date and time is required')
    .refine((val) => !isNaN(new Date(val).getTime()), {
      message: 'Please provide a valid calendar date and time',
    }),
  priority: priorityEnum.optional().default('medium'),
  notes: z
    .string()
    .trim()
    .max(2000, 'Notes cannot exceed 2000 characters')
    .optional()
    .nullable(),
  reminder10mSent: z.boolean().optional(),
  reminder5mSent: z.boolean().optional(),
  reminder0mSent: z.boolean().optional(),
});

export const updateFollowUpSchema = z.object({
  assignedTo: z.string().optional().nullable(),
  type: followUpTypeEnum.optional(),
  scheduledAt: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(new Date(val).getTime()), {
      message: 'Please provide a valid calendar date and time',
    }),
  status: z.enum(['pending', 'completed', 'cancelled', 'overdue']).optional(),
  priority: priorityEnum.optional(),
  notes: z
    .string()
    .trim()
    .max(2000, 'Notes cannot exceed 2000 characters')
    .optional()
    .nullable(),
  outcome: z
    .enum(['no_answer', 'busy', 'call_back', 'interested', 'not_interested', 'wrong_number', 'connected', 'follow_up_required', ''])
    .optional(),
  reminder10mSent: z.boolean().optional(),
  reminder5mSent: z.boolean().optional(),
  reminder0mSent: z.boolean().optional(),
});
