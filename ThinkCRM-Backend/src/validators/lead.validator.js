import { z } from 'zod';
import { isValidPhoneString } from '../utils/phoneValidator.js';

const projectTypeEnum = z.enum([
  'Kitchen', 'Modular Kitchen', 'Wardrobe', 'Wardrobe Design',
  'Bedroom', 'Living Room', 'Office', 'Office Interior',
  'Full Home', 'Full Home Interior', 'Commercial', 'Other'
], {
  errorMap: () => ({ message: 'Please select a valid project type' })
});

const leadSourceEnum = z.enum([
  'Meta', 'Meta Ads', 'Facebook', 'Instagram', 'Website',
  'Google', 'Google Ads', 'WhatsApp', 'Referral', 'Phone', 'Walk-in', 'Manual', 'Other'
], {
  errorMap: () => ({ message: 'Please select a valid lead source' })
});

const priorityEnum = z.enum(['low', 'medium', 'high', 'urgent'], {
  errorMap: () => ({ message: 'Please select a valid priority level' })
});

const statusEnum = z.enum([
  'new', 'attempted', 'contacted', 'qualified', 'follow_up', 'in_progress',
  'measurement_pending', 'measurement_scheduled', 'measurement_completed',
  'quotation_pending', 'quotation_sent', 'negotiation', 'won', 'converted', 'lost', 'junk'
], {
  errorMap: () => ({ message: 'Please select a valid lead status' })
});

const measurementStatusEnum = z.enum(['not_done', 'pending', 'scheduled', 'done', 'completed']);
const quotationStatusEnum = z.enum(['pending', 'sent', 'approved', 'draft', 'rejected', 'not_uploaded']);

export const createLeadSchema = z.object({
  fullName: z
    .string({ required_error: 'Full name is required' })
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name cannot exceed 100 characters')
    .refine((val) => val.replace(/\s+/g, ' ').length >= 2, {
      message: 'Full name cannot be blank or only whitespace',
    }),
  phone: z
    .string({ required_error: 'Phone number is required' })
    .trim()
    .min(1, 'Phone number is required')
    .refine(isValidPhoneString, {
      message: 'Enter a valid 10-digit Indian mobile number (or valid international number)',
    }),
  alternatePhone: z
    .string()
    .trim()
    .optional()
    .nullable()
    .or(z.literal(''))
    .refine((val) => !val || isValidPhoneString(val), {
      message: 'Alternate phone must be a valid number',
    }),
  email: z
    .string()
    .trim()
    .email('Enter a valid email address')
    .optional()
    .nullable()
    .or(z.literal('')),
  location: z.string().trim().max(200).optional().nullable(),
  address: z.string().trim().max(300).optional().nullable(),
  city: z.string().trim().max(100).optional().nullable(),
  state: z.string().trim().max(100).optional().nullable(),
  pincode: z.string().trim().max(20).optional().nullable(),
  projectType: projectTypeEnum.optional().default('Full Home'),
  projectDescription: z.string().trim().max(3000).optional().nullable(),
  requirement: z.string().trim().max(3000).optional().nullable(),
  budget: z
    .union([z.number(), z.string()])
    .optional()
    .nullable()
    .transform((val) => (val === '' || val === null || val === undefined ? undefined : Number(val)))
    .refine((val) => val === undefined || (!isNaN(val) && val >= 0), {
      message: 'Budget cannot be negative or invalid number',
    }),
  budgetRange: z.string().trim().max(100).optional().nullable(),
  preferredTimeline: z.string().trim().max(100).optional().nullable(),
  expectedStartDate: z.string().optional().nullable(),
  leadSource: leadSourceEnum.optional().default('Website'),
  status: statusEnum.optional().default('new'),
  measurementStatus: measurementStatusEnum.optional().default('not_done'),
  quotationStatus: quotationStatusEnum.optional().default('pending'),
  priority: priorityEnum.optional().default('medium'),
  assignedTo: z.string().optional().nullable(),
  notes: z.string().trim().max(5000).optional().nullable(),
  tags: z.array(z.string().trim().max(50)).optional(),
  metaLeadId: z.string().optional().nullable(),
  // Initial follow-up if created together
  nextFollowUpDate: z.string().optional().nullable(),
  nextFollowUpTime: z.string().optional().nullable(),
  nextFollowUpType: z.string().optional().nullable(),
  sendReminderNotification: z.boolean().optional().nullable(),
});

export const updateLeadSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name cannot exceed 100 characters')
    .optional(),
  phone: z
    .string()
    .trim()
    .min(1)
    .refine(isValidPhoneString, {
      message: 'Enter a valid 10-digit Indian mobile number (or valid international number)',
    })
    .optional(),
  alternatePhone: z
    .string()
    .trim()
    .optional()
    .nullable()
    .or(z.literal(''))
    .refine((val) => !val || isValidPhoneString(val), {
      message: 'Alternate phone must be a valid number',
    }),
  email: z
    .string()
    .trim()
    .email('Enter a valid email address')
    .optional()
    .nullable()
    .or(z.literal('')),
  location: z.string().trim().max(200).optional().nullable(),
  address: z.string().trim().max(300).optional().nullable(),
  city: z.string().trim().max(100).optional().nullable(),
  state: z.string().trim().max(100).optional().nullable(),
  pincode: z.string().trim().max(20).optional().nullable(),
  projectType: projectTypeEnum.optional(),
  projectDescription: z.string().trim().max(3000).optional().nullable(),
  requirement: z.string().trim().max(3000).optional().nullable(),
  budget: z
    .union([z.number(), z.string()])
    .optional()
    .nullable()
    .transform((val) => (val === '' || val === null || val === undefined ? undefined : Number(val)))
    .refine((val) => val === undefined || (!isNaN(val) && val >= 0), {
      message: 'Budget cannot be negative or invalid number',
    }),
  budgetRange: z.string().trim().max(100).optional().nullable(),
  preferredTimeline: z.string().trim().max(100).optional().nullable(),
  expectedStartDate: z.string().optional().nullable(),
  leadSource: leadSourceEnum.optional(),
  priority: priorityEnum.optional(),
  status: statusEnum.optional(),
  measurementStatus: measurementStatusEnum.optional(),
  quotationStatus: quotationStatusEnum.optional(),
  assignedTo: z.string().optional().nullable(),
  notes: z.string().trim().max(5000).optional().nullable(),
  tags: z.array(z.string().trim().max(50)).optional(),
});

export const assignLeadSchema = z.object({
  assignedTo: z.string().min(1, 'Assigned user ID is required'),
});
