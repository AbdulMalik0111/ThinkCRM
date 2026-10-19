import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().optional(),
    oldPassword: z.string().optional(),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  })
  .refine((data) => data.currentPassword || data.oldPassword, {
    message: 'Current password is required',
    path: ['currentPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});
