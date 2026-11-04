import { z } from 'zod';

export const updateSettingsSchema = z.object({
  defaultLowStockThreshold: z.coerce
    .number()
    .int('Default threshold must be an integer')
    .min(0, 'Default threshold cannot be negative')
    .optional(),
  name: z.string().trim().min(2, 'Organization name must be at least 2 characters').optional(),
  currency: z.string().trim().max(10).optional(),
  currencySymbol: z.string().trim().max(5).optional(),
  taxRate: z.coerce.number().min(0).max(100).optional(),
  phone: z.string().trim().max(20).optional().nullable(),
  address: z.string().trim().max(255).optional().nullable(),
  invoiceFooter: z.string().trim().max(255).optional().nullable(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
