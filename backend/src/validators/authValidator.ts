import { z } from 'zod';

export const signupSchema = z
  .object({
    email: z.string().trim().email('Please provide a valid email address').max(255),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .max(72, 'Password must not exceed 72 characters'),
    confirmPassword: z.string(),
    organizationName: z
      .string()
      .trim()
      .min(2, 'Organization name must be at least 2 characters')
      .max(100, 'Organization name must not exceed 100 characters'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z.string().trim().email('Please provide a valid email address').max(255),
  password: z.string().min(1, 'Password is required').max(72),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
