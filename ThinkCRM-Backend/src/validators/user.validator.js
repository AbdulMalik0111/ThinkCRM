import { z } from 'zod';
import { isValidPhoneString } from '../utils/phoneValidator.js';

const roleEnum = z.enum(['Owner', 'Admin', 'Sales Manager', 'Sales Executive', 'Staff'], {
  errorMap: () => ({ message: 'Please select a valid staff role' }),
});

export const createUserSchema = z.object({
  firstName: z
    .string({ required_error: 'First name is required' })
    .trim()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name cannot exceed 50 characters'),
  lastName: z
    .string({ required_error: 'Last name is required' })
    .trim()
    .min(1, 'Last name is required')
    .max(50, 'Last name cannot exceed 50 characters'),
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Enter a valid email address'),
  phone: z
    .string()
    .trim()
    .optional()
    .nullable()
    .or(z.literal(''))
    .refine((val) => !val || isValidPhoneString(val), {
      message: 'Enter a valid phone number (10-digit Indian mobile or valid international number)',
    }),
  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password cannot exceed 100 characters'),
  role: roleEnum.optional().default('Staff'),
  permissionMode: z.enum(['INHERIT_ROLE', 'CUSTOM', 'SUPER_ADMIN']).optional(),
  permissions: z.array(z.string()).optional(),
  assignedPermissions: z.array(z.string()).optional(),
});

export const updateUserSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, 'First name must be at least 2 characters')
    .max(50)
    .optional(),
  lastName: z
    .string()
    .trim()
    .min(1, 'Last name is required')
    .max(50)
    .optional(),
  phone: z
    .string()
    .trim()
    .optional()
    .nullable()
    .or(z.literal(''))
    .refine((val) => !val || isValidPhoneString(val), {
      message: 'Enter a valid phone number',
    }),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Enter a valid email address')
    .optional(),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100)
    .optional()
    .or(z.literal('')),
  role: roleEnum.optional(),
  permissionMode: z.enum(['INHERIT_ROLE', 'CUSTOM', 'SUPER_ADMIN']).optional(),
  permissions: z.array(z.string()).optional(),
  assignedPermissions: z.array(z.string()).optional(),
  status: z.enum(['active', 'disabled', 'suspended']).optional(),
  isActive: z.boolean().optional(),
});
