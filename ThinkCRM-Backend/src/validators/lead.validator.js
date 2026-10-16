import { z } from 'zod';

const projectTypeEnum = z.enum([
  'Kitchen', 'Modular Kitchen', 'Wardrobe', 'Wardrobe Design',
  'Bedroom', 'Living Room', 'Office', 'Office Interior',
  'Full Home', 'Full Home Interior', 'Commercial', 'Other'
]);

const leadSourceEnum = z.enum([
  'Meta', 'Meta Ads', 'Facebook', 'Instagram', 'Website',
  'Google', 'Google Ads', 'WhatsApp', 'Referral', 'Phone', 'Walk-in', 'Manual', 'Other'
]);

const priorityEnum = z.enum(['low', 'medium', 'high', 'urgent']);

const statusEnum = z.enum([
  'new', 'attempted', 'contacted', 'qualified', 'follow_up', 'in_progress',
  'measurement_pending', 'measurement_scheduled', 'measurement_completed',
  'quotation_pending', 'quotation_sent', 'negotiation', 'won', 'converted', 'lost', 'junk'
]);

export const createLeadSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  phone: z.string().min(1, 'Phone is required'),
  alternatePhone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  location: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  pincode: z.string().optional().nullable(),
  projectType: projectTypeEnum.optional().default('Full Home'),
  projectDescription: z.string().optional().nullable(),
  budget: z.number().optional().nullable(),
  budgetRange: z.string().optional().nullable(),
  preferredTimeline: z.string().optional().nullable(),
  expectedStartDate: z.string().optional().nullable(),
  leadSource: leadSourceEnum.optional().default('Website'),
  status: statusEnum.optional().default('new'),
  priority: priorityEnum.optional().default('medium'),
  assignedTo: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  metaLeadId: z.string().optional().nullable(),
  // Initial follow-up if created together
  nextFollowUpDate: z.string().optional().nullable(),
  nextFollowUpTime: z.string().optional().nullable(),
  nextFollowUpType: z.string().optional().nullable(),
  sendReminderNotification: z.boolean().optional().nullable(),
});

export const updateLeadSchema = z.object({
  fullName: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  alternatePhone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  location: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  pincode: z.string().optional().nullable(),
  projectType: projectTypeEnum.optional(),
  projectDescription: z.string().optional().nullable(),
  budget: z.number().optional().nullable(),
  budgetRange: z.string().optional().nullable(),
  preferredTimeline: z.string().optional().nullable(),
  expectedStartDate: z.string().optional().nullable(),
  leadSource: leadSourceEnum.optional(),
  priority: priorityEnum.optional(),
  status: statusEnum.optional(),
  assignedTo: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
});

export const assignLeadSchema = z.object({
  assignedTo: z.string().min(1, 'Assigned user ID is required'),
});
