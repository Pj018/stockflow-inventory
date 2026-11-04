import { prisma } from '../lib/prisma';
import { AppError } from '../middlewares/errorHandler';
import { CreateSupplierInput, UpdateSupplierInput } from '../validators/supplierValidator';

export class SupplierService {
  static async getSuppliers(organizationId: string) {
    const suppliers = await prisma.supplier.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return suppliers;
  }

  static async createSupplier(organizationId: string, data: CreateSupplierInput) {
    const supplier = await prisma.supplier.create({
      data: {
        organizationId,
        name: data.name.trim(),
        contactPerson: data.contactPerson?.trim() || null,
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        address: data.address?.trim() || null,
      },
    });

    return supplier;
  }

  static async updateSupplier(id: string, organizationId: string, data: UpdateSupplierInput) {
    const existing = await prisma.supplier.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new AppError('Supplier not found in your organization.', 404);
    }

    const updated = await prisma.supplier.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name.trim() : undefined,
        contactPerson: data.contactPerson !== undefined ? data.contactPerson?.trim() || null : undefined,
        email: data.email !== undefined ? data.email?.trim() || null : undefined,
        phone: data.phone !== undefined ? data.phone?.trim() || null : undefined,
        address: data.address !== undefined ? data.address?.trim() || null : undefined,
      },
    });

    return updated;
  }

  static async deleteSupplier(id: string, organizationId: string) {
    const existing = await prisma.supplier.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new AppError('Supplier not found in your organization.', 404);
    }

    await prisma.supplier.delete({
      where: { id },
    });

    return { message: 'Supplier deleted successfully', id };
  }
}
