import { z } from 'zod';

export const createFollowUpSchema = z.object({
  assignedTo: z.string().optional(),
  type: z.enum(['call', 'whatsapp', 'email', 'site_visit', 'measurement', 'quotation', 'quotation_followup', 'other']),
  scheduledAt: z.string().min(1, 'Scheduled date is required'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  notes: z.string().optional(),
  reminder10mSent: z.boolean().optional(),
  reminder5mSent: z.boolean().optional(),
  reminder0mSent: z.boolean().optional(),
});

export const updateFollowUpSchema = z.object({
  assignedTo: z.string().optional(),
  type: z.enum(['call', 'whatsapp', 'email', 'site_visit', 'measurement', 'quotation', 'quotation_followup', 'other']).optional(),
  scheduledAt: z.string().optional(),
  status: z.enum(['pending', 'completed', 'cancelled', 'overdue']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  notes: z.string().optional(),
  outcome: z.enum(['no_answer', 'busy', 'call_back', 'interested', 'not_interested', 'wrong_number', 'connected', 'follow_up_required', '']).optional(),
  reminder10mSent: z.boolean().optional(),
  reminder5mSent: z.boolean().optional(),
  reminder0mSent: z.boolean().optional(),
});
