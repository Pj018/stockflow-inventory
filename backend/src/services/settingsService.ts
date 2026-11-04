import { prisma } from '../lib/prisma';
import { AppError } from '../middlewares/errorHandler';
import { UpdateSettingsInput } from '../validators/settingsValidator';

export class SettingsService {
  static async getSettings(organizationId: string) {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        _count: {
          select: {
            products: true,
            users: true,
          },
        },
      },
    });

    if (!org) {
      throw new AppError('Organization not found.', 404);
    }

    return org;
  }

  static async updateSettings(organizationId: string, data: UpdateSettingsInput) {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!org) {
      throw new AppError('Organization not found.', 404);
    }

    const updated = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        defaultLowStockThreshold:
          data.defaultLowStockThreshold !== undefined
            ? data.defaultLowStockThreshold
            : undefined,
        name: data.name !== undefined ? data.name.trim() : undefined,
        currency: data.currency !== undefined ? data.currency.trim() : undefined,
        currencySymbol: data.currencySymbol !== undefined ? data.currencySymbol.trim() : undefined,
        taxRate: data.taxRate !== undefined ? data.taxRate : undefined,
        phone: data.phone !== undefined ? data.phone?.trim() || null : undefined,
        address: data.address !== undefined ? data.address?.trim() || null : undefined,
        invoiceFooter: data.invoiceFooter !== undefined ? data.invoiceFooter?.trim() || null : undefined,
      },
    });

    return updated;
  }
}
