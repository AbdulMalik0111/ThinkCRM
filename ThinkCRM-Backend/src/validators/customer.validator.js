import { z } from 'zod';
import { isValidPhoneString } from '../utils/phoneValidator.js';

export const createCustomerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, 'Full name must be at least 2 characters')
      .max(100, 'Full name cannot exceed 100 characters')
      .optional(),
    phone: z
      .string()
      .trim()
      .min(1, 'Phone is required')
      .refine(isValidPhoneString, {
        message: 'Enter a valid 10-digit Indian mobile number (or valid international number)',
      })
      .optional(),
    email: z
      .string()
      .trim()
      .email('Enter a valid email address')
      .optional()
      .nullable()
      .or(z.literal('')),
    alternatePhone: z
      .string()
      .trim()
      .optional()
      .nullable()
      .or(z.literal(''))
      .refine((val) => !val || isValidPhoneString(val), {
        message: 'Alternate phone must be a valid number',
      }),
    avatar: z.string().optional().nullable(),
    source: z.string().trim().max(100).optional(),
    status: z.enum(['active', 'in_progress', 'completed', 'on_hold']).optional().default('active'),
    assignedStaff: z.string().optional().nullable(),
    tags: z.array(z.string().trim().max(50)).optional(),
    address: z.string().trim().max(300).optional().nullable(),
    city: z.string().trim().max(100).optional().nullable(),
    state: z.string().trim().max(100).optional().nullable(),
    pincode: z.string().trim().max(20).optional().nullable(),
    country: z.string().trim().max(100).optional().default('India'),
    location: z.string().trim().max(200).optional().nullable(),
    customerType: z
      .string()
      .optional()
      .transform((val) => (val ? val.toLowerCase() : 'individual'))
      .refine((val) => ['individual', 'business'].includes(val), {
        message: 'Customer type must be individual or business',
      }),
    companyName: z.string().trim().max(150).optional().nullable(),
    gstin: z.string().trim().max(30).optional().nullable(),
    projectName: z.string().trim().max(150).optional().nullable(),
    projectType: z.string().trim().max(100).optional().default('Modular Kitchen'),
    projectDescription: z.string().trim().max(3000).optional().nullable(),
    totalValue: z
      .union([z.number(), z.string()])
      .optional()
      .nullable()
      .transform((val) => (val === '' || val === null || val === undefined ? undefined : Number(val)))
      .refine((val) => val === undefined || (!isNaN(val) && val >= 0), {
        message: 'Total value cannot be negative',
      }),
    budget: z
      .union([z.number(), z.string()])
      .optional()
      .nullable()
      .transform((val) => (val === '' || val === null || val === undefined ? undefined : Number(val)))
      .refine((val) => val === undefined || (!isNaN(val) && val >= 0), {
        message: 'Budget cannot be negative',
      }),
    projectStatus: z.enum(['active', 'in_progress', 'completed', 'on_hold']).optional().default('active'),
    startDate: z.string().optional().nullable().or(z.date()),
    completionDate: z.string().optional().nullable().or(z.date()),
    sourceLeadId: z.string().optional().nullable(),
    preferredContactMethod: z.string().optional().nullable(),
    bestTimeToContact: z.string().optional().nullable(),
    communicationNotes: z.string().trim().max(2000).optional().nullable(),
    generalNotes: z.string().trim().max(5000).optional().nullable(),
  })
  .refine((data) => data.sourceLeadId || (data.fullName && data.phone), {
    message: 'Either sourceLeadId or Full Name and Phone must be provided',
  });

export const updateCustomerSchema = z.object({
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
  avatar: z.string().optional().nullable(),
  source: z.string().trim().max(100).optional(),
  status: z.enum(['active', 'in_progress', 'completed', 'on_hold']).optional(),
  assignedStaff: z.string().optional().nullable(),
  tags: z.array(z.string().trim().max(50)).optional(),
  address: z.string().trim().max(300).optional().nullable(),
  city: z.string().trim().max(100).optional().nullable(),
  state: z.string().trim().max(100).optional().nullable(),
  pincode: z.string().trim().max(20).optional().nullable(),
  country: z.string().trim().max(100).optional(),
  location: z.string().trim().max(200).optional().nullable(),
  customerType: z
    .string()
    .optional()
    .transform((val) => (val ? val.toLowerCase() : undefined))
    .refine((val) => val === undefined || ['individual', 'business'].includes(val), {
      message: 'Customer type must be individual or business',
    }),
  companyName: z.string().trim().max(150).optional().nullable(),
  gstin: z.string().trim().max(30).optional().nullable(),
  projectName: z.string().trim().max(150).optional().nullable(),
  projectType: z.string().trim().max(100).optional(),
  totalValue: z
    .union([z.number(), z.string()])
    .optional()
    .nullable()
    .transform((val) => (val === '' || val === null || val === undefined ? undefined : Number(val)))
    .refine((val) => val === undefined || (!isNaN(val) && val >= 0), {
      message: 'Total value cannot be negative',
    }),
  budget: z
    .union([z.number(), z.string()])
    .optional()
    .nullable()
    .transform((val) => (val === '' || val === null || val === undefined ? undefined : Number(val)))
    .refine((val) => val === undefined || (!isNaN(val) && val >= 0), {
      message: 'Budget cannot be negative',
    }),
  projects: z.array(z.any()).optional(),
  preferredContactMethod: z.string().optional().nullable(),
  bestTimeToContact: z.string().optional().nullable(),
  communicationNotes: z.string().trim().max(2000).optional().nullable(),
  generalNotes: z.string().trim().max(5000).optional().nullable(),
});

export const addCustomerProjectSchema = z.object({
  projectName: z
    .string({ required_error: 'Project name is required' })
    .trim()
    .min(2, 'Project name must be at least 2 characters')
    .max(150, 'Project name cannot exceed 150 characters'),
  projectType: z
    .string({ required_error: 'Project type is required' })
    .trim()
    .min(1, 'Project type is required'),
  budget: z
    .union([z.number(), z.string()])
    .optional()
    .nullable()
    .transform((val) => (val === '' || val === null || val === undefined ? 0 : Number(val)))
    .refine((val) => !isNaN(val) && val >= 0, {
      message: 'Budget cannot be negative',
    }),
  status: z.enum(['active', 'in_progress', 'completed', 'on_hold']).optional().default('active'),
  startDate: z.string().optional().nullable().or(z.date()),
  completionDate: z.string().optional().nullable().or(z.date()),
  description: z.string().trim().max(3000, 'Description cannot exceed 3000 characters').optional().nullable(),
  assignedStaff: z.string().optional().nullable(),
});

export const logCustomerCallSchema = z.object({
  outcome: z
    .enum(['connected', 'callback_requested', 'busy', 'no_answer', 'wrong_number'])
    .optional()
    .default('connected'),
  duration: z
    .union([z.number(), z.string()])
    .optional()
    .nullable()
    .transform((val) => (val === '' || val === null || val === undefined ? 0 : Number(val)))
    .refine((val) => !isNaN(val) && val >= 0 && val <= 1440, {
      message: 'Duration must be between 0 and 1440 minutes',
    }),
  leadId: z.string().optional().nullable(),
  notes: z.string().trim().max(2000, 'Notes cannot exceed 2000 characters').optional().nullable(),
});

