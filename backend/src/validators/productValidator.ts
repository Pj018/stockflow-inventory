import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().trim().min(1, 'Product name is required'),
  sku: z.string().trim().min(1, 'SKU is required'),
  description: z.string().trim().optional().nullable(),
  quantity: z.coerce.number().int('Quantity must be an integer').min(0, 'Quantity cannot be negative').default(0),
  costPrice: z.coerce.number().min(0, 'Cost price cannot be negative').optional().nullable(),
  sellingPrice: z.coerce.number().min(0, 'Selling price cannot be negative').optional().nullable(),
  lowStockThreshold: z.coerce.number().int('Threshold must be an integer').min(0, 'Threshold cannot be negative').optional().nullable(),
});

export const updateProductSchema = z.object({
  name: z.string().trim().min(1, 'Product name is required').optional(),
  sku: z.string().trim().min(1, 'SKU is required').optional(),
  description: z.string().trim().optional().nullable(),
  quantity: z.coerce.number().int('Quantity must be an integer').min(0, 'Quantity cannot be negative').optional(),
  costPrice: z.coerce.number().min(0, 'Cost price cannot be negative').optional().nullable(),
  sellingPrice: z.coerce.number().min(0, 'Selling price cannot be negative').optional().nullable(),
  lowStockThreshold: z.coerce.number().int('Threshold must be an integer').min(0, 'Threshold cannot be negative').optional().nullable(),
});

export const adjustStockSchema = z.object({
  changeAmount: z.coerce.number().int('Adjustment must be a whole integer').refine((val) => val !== 0, {
    message: 'Adjustment amount cannot be zero',
  }),
  note: z.string().trim().max(255).optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type AdjustStockInput = z.infer<typeof adjustStockSchema>;
