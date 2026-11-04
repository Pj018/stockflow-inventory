import { z } from 'zod';

export const createSupplierSchema = z.object({
  name: z.string().trim().min(1, 'Supplier name is required').max(100),
  contactPerson: z.string().trim().max(100).optional().nullable(),
  email: z.string().trim().email('Invalid email address').optional().nullable().or(z.literal('')),
  phone: z.string().trim().max(20).optional().nullable(),
  address: z.string().trim().max(255).optional().nullable(),
});

export const updateSupplierSchema = createSupplierSchema.partial();

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
