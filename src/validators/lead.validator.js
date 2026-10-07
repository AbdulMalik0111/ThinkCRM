import { z } from 'zod';

export const createLeadSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  phone: z.string().min(1, 'Phone is required'),
  alternatePhone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  location: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  projectType: z.enum(['Kitchen', 'Wardrobe', 'Bedroom', 'Living Room', 'Office', 'Full Home', 'Commercial', 'Other']),
  projectDescription: z.string().optional(),
  budget: z.number().optional(),
  expectedStartDate: z.string().optional(),
  leadSource: z.enum(['Meta', 'Facebook', 'Instagram', 'Website', 'Google', 'WhatsApp', 'Referral', 'Phone', 'Walk-in', 'Manual', 'Other']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metaLeadId: z.string().optional()
});

export const updateLeadSchema = z.object({
  fullName: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  alternatePhone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  location: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  projectType: z.enum(['Kitchen', 'Wardrobe', 'Bedroom', 'Living Room', 'Office', 'Full Home', 'Commercial', 'Other']).optional(),
  projectDescription: z.string().optional(),
  budget: z.number().optional(),
  expectedStartDate: z.string().optional(),
  leadSource: z.enum(['Meta', 'Facebook', 'Instagram', 'Website', 'Google', 'WhatsApp', 'Referral', 'Phone', 'Walk-in', 'Manual', 'Other']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  status: z.enum([
    'new', 'attempted', 'contacted', 'qualified', 'follow_up', 
    'measurement_pending', 'measurement_scheduled', 'measurement_completed', 
    'quotation_pending', 'quotation_sent', 'negotiation', 'won', 'lost', 'junk'
  ]).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const assignLeadSchema = z.object({
  assignedTo: z.string().min(1, 'Assigned user ID is required'),
});
