import { z } from 'zod';
import { isValidPhoneString } from '../utils/phoneValidator.js';

export const updateSettingSchema = z.object({
  companyName: z.string().trim().max(150).optional(),
  companyEmail: z.string().trim().toLowerCase().email('Enter a valid company email').optional().nullable().or(z.literal('')),
  companyPhone: z
    .string()
    .trim()
    .optional()
    .nullable()
    .or(z.literal(''))
    .refine((val) => !val || isValidPhoneString(val), {
      message: 'Company phone must be a valid phone number',
    }),
  companyAddress: z.string().trim().max(500).optional().nullable(),
  logo: z.string().optional().nullable(),
  emailSettings: z.record(z.any()).optional(),
  leadSettings: z.record(z.any()).optional(),
  notificationSettings: z.record(z.any()).optional(),
  defaultAssignmentSettings: z.record(z.any()).optional(),
});
