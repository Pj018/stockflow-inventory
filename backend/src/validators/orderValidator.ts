import { z } from 'zod';

export const createOrderSchema = z.object({
  customerName: z.string().trim().max(100).optional(),
  customerPhone: z.string().trim().max(20).optional(),
  paymentMethod: z.enum(['CASH', 'UPI', 'CARD', 'OTHER']).default('CASH'),
  discountAmount: z.number().min(0).default(0),
  taxAmount: z.number().min(0).default(0),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, 'Product ID is required'),
        quantity: z.number().int().min(1, 'Quantity must be at least 1'),
        unitPrice: z.number().min(0).optional(),
      })
    )
    .min(1, 'At least one item is required in the sale'),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
