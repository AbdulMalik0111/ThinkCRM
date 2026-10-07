import { z } from 'zod';

export const updateSettingSchema = z.object({
  companyName: z.string().optional(),
  companyEmail: z.string().email().optional().or(z.literal('')),
  companyPhone: z.string().optional(),
  companyAddress: z.string().optional(),
  logo: z.string().optional(),
  emailSettings: z.record(z.any()).optional(),
  leadSettings: z.record(z.any()).optional(),
  notificationSettings: z.record(z.any()).optional(),
  defaultAssignmentSettings: z.record(z.any()).optional(),
});
