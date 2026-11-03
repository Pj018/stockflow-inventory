import { z } from 'zod';

export const updateSettingsSchema = z.object({
  defaultLowStockThreshold: z.coerce
    .number()
    .int('Default threshold must be an integer')
    .min(0, 'Default threshold cannot be negative')
    .optional(),
  name: z.string().trim().min(2, 'Organization name must be at least 2 characters').optional(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
