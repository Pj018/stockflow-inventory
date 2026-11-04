import { prisma } from '../lib/prisma';
import { AppError } from '../middlewares/errorHandler';
import {
  CreateProductInput,
  UpdateProductInput,
  BulkImportInput,
} from '../validators/productValidator';

export class ProductService {
  static async getProducts(organizationId: string, search?: string, lowStockOnly = false) {
    // Retrieve organization default threshold
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { defaultLowStockThreshold: true, currencySymbol: true },
    });
    const defaultThreshold = org?.defaultLowStockThreshold ?? 5;

    // Build filter
    const whereClause: any = {
      organizationId,
    };

    if (search && search.trim()) {
      const q = search.trim();
      whereClause.OR = [
        { name: { contains: q } },
        { sku: { contains: q } },
        { barcode: { contains: q } },
        { category: { contains: q } },
      ];
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        supplier: {
          select: { id: true, name: true, phone: true },
        },
        stockLogs: {
          take: 3,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    const enriched = products.map((product) => {
      const effectiveThreshold =
        product.lowStockThreshold !== null && product.lowStockThreshold !== undefined
          ? product.lowStockThreshold
          : defaultThreshold;
      const isLowStock = product.quantity <= effectiveThreshold;

      return {
        ...product,
        effectiveThreshold,
        isLowStock,
      };
    });

    if (lowStockOnly) {
      return enriched.filter((p) => p.isLowStock);
    }

    return enriched;
  }

  static async getProductById(id: string, organizationId: string) {
    const product = await prisma.product.findFirst({
      where: { id, organizationId },
      include: {
        supplier: true,
        stockLogs: {
          take: 15,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product) {
      throw new AppError('Product not found in your organization.', 404);
    }

    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { defaultLowStockThreshold: true, currencySymbol: true },
    });
    const effectiveThreshold =
      product.lowStockThreshold ?? org?.defaultLowStockThreshold ?? 5;

    return {
      ...product,
      effectiveThreshold,
      isLowStock: product.quantity <= effectiveThreshold,
    };
  }

  static async createProduct(
    organizationId: string,
    data: CreateProductInput,
    userEmail: string
  ) {
    const trimmedSku = data.sku.trim();

    // Check SKU uniqueness per organization
    const existingSku = await prisma.product.findUnique({
      where: {
        organizationId_sku: {
          organizationId,
          sku: trimmedSku,
        },
      },
    });

    if (existingSku) {
      throw new AppError(`A product with SKU "${trimmedSku}" already exists in your organization.`, 409);
    }

    const product = await prisma.product.create({
      data: {
        organizationId,
        name: data.name.trim(),
        sku: trimmedSku,
        barcode: data.barcode?.trim() || trimmedSku,
        category: data.category?.trim() || 'General',
        description: data.description ? data.description.trim() : null,
        quantity: data.quantity ?? 0,
        costPrice: data.costPrice ?? null,
        sellingPrice: data.sellingPrice ?? null,
        lowStockThreshold: data.lowStockThreshold ?? null,
        supplierId: data.supplierId || null,
        lastUpdatedBy: userEmail,
      },
    });

    // If initial quantity > 0, log an initial stock record
    if (product.quantity > 0) {
      await prisma.stockLog.create({
        data: {
          organizationId,
          productId: product.id,
          changeAmount: product.quantity,
          previousQty: 0,
          newQty: product.quantity,
          note: 'Initial inventory entry',
          updatedBy: userEmail,
        },
      });
    }

    return product;
  }

  static async updateProduct(
    id: string,
    organizationId: string,
    data: UpdateProductInput,
    userEmail: string
  ) {
    const existing = await prisma.product.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new AppError('Product not found in your organization.', 404);
    }

    // If SKU is being updated, verify it doesn't collide with another product in this org
    if (data.sku && data.sku.trim() !== existing.sku) {
      const skuCollision = await prisma.product.findUnique({
        where: {
          organizationId_sku: {
            organizationId,
            sku: data.sku.trim(),
          },
        },
      });

      if (skuCollision && skuCollision.id !== id) {
        throw new AppError(`Another product already uses the SKU "${data.sku.trim()}".`, 409);
      }
    }

    // Check if quantity changed directly through edit form
    const qtyChanged = data.quantity !== undefined && data.quantity !== existing.quantity;

    const updated = await prisma.$transaction(async (tx) => {
      const product = await tx.product.update({
        where: { id },
        data: {
          name: data.name !== undefined ? data.name.trim() : undefined,
          sku: data.sku !== undefined ? data.sku.trim() : undefined,
          barcode: data.barcode !== undefined ? data.barcode?.trim() : undefined,
          category: data.category !== undefined ? data.category?.trim() : undefined,
          description: data.description !== undefined ? data.description : undefined,
          quantity: data.quantity !== undefined ? data.quantity : undefined,
          costPrice: data.costPrice !== undefined ? data.costPrice : undefined,
          sellingPrice: data.sellingPrice !== undefined ? data.sellingPrice : undefined,
          lowStockThreshold: data.lowStockThreshold !== undefined ? data.lowStockThreshold : undefined,
          supplierId: data.supplierId !== undefined ? data.supplierId : undefined,
          lastUpdatedBy: userEmail,
        },
      });

      if (qtyChanged && data.quantity !== undefined) {
        await tx.stockLog.create({
          data: {
            organizationId,
            productId: id,
            changeAmount: data.quantity - existing.quantity,
            previousQty: existing.quantity,
            newQty: data.quantity,
            note: 'Manual edit update',
            updatedBy: userEmail,
          },
        });
      }

      return product;
    });

    return updated;
  }

  static async adjustStock(
    id: string,
    organizationId: string,
    changeAmount: number,
    note: string | undefined,
    userEmail: string
  ) {
    const existing = await prisma.product.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new AppError('Product not found in your organization.', 404);
    }

    const previousQty = existing.quantity;
    const newQty = previousQty + changeAmount;

    if (newQty < 0) {
      throw new AppError(
        `Cannot reduce stock by ${Math.abs(changeAmount)}. Current stock is only ${previousQty}.`,
        400
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedProduct = await tx.product.update({
        where: { id },
        data: {
          quantity: newQty,
          lastUpdatedBy: userEmail,
        },
      });

      const log = await tx.stockLog.create({
        data: {
          organizationId,
          productId: id,
          changeAmount,
          previousQty,
          newQty,
          note: note?.trim() || (changeAmount > 0 ? 'Stock received' : 'Stock reduced'),
          updatedBy: userEmail,
        },
      });

      return { product: updatedProduct, log };
    });

    return result;
  }

  static async bulkImport(organizationId: string, input: BulkImportInput, userEmail: string) {
    let createdCount = 0;
    let updatedCount = 0;

    await prisma.$transaction(async (tx) => {
      for (const item of input.products) {
        const sku = item.sku.trim();
        const existing = await tx.product.findUnique({
          where: { organizationId_sku: { organizationId, sku } },
        });

        if (existing) {
          const qtyDiff = item.quantity - existing.quantity;
          await tx.product.update({
            where: { id: existing.id },
            data: {
              name: item.name.trim(),
              description: item.description !== undefined ? item.description : existing.description,
              quantity: item.quantity,
              costPrice: item.costPrice !== undefined ? item.costPrice : existing.costPrice,
              sellingPrice: item.sellingPrice !== undefined ? item.sellingPrice : existing.sellingPrice,
              lowStockThreshold:
                item.lowStockThreshold !== undefined ? item.lowStockThreshold : existing.lowStockThreshold,
              category: item.category || existing.category,
              barcode: item.barcode || existing.barcode,
              lastUpdatedBy: userEmail,
            },
          });

          if (qtyDiff !== 0) {
            await tx.stockLog.create({
              data: {
                organizationId,
                productId: existing.id,
                changeAmount: qtyDiff,
                previousQty: existing.quantity,
                newQty: item.quantity,
                note: 'Bulk CSV Import update',
                updatedBy: userEmail,
              },
            });
          }
          updatedCount++;
        } else {
          const newProd = await tx.product.create({
            data: {
              organizationId,
              name: item.name.trim(),
              sku,
              barcode: item.barcode?.trim() || sku,
              category: item.category?.trim() || 'General',
              description: item.description ? item.description.trim() : null,
              quantity: item.quantity ?? 0,
              costPrice: item.costPrice ?? null,
              sellingPrice: item.sellingPrice ?? null,
              lowStockThreshold: item.lowStockThreshold ?? null,
              lastUpdatedBy: userEmail,
            },
          });

          if (newProd.quantity > 0) {
            await tx.stockLog.create({
              data: {
                organizationId,
                productId: newProd.id,
                changeAmount: newProd.quantity,
                previousQty: 0,
                newQty: newProd.quantity,
                note: 'Bulk CSV Import entry',
                updatedBy: userEmail,
              },
            });
          }
          createdCount++;
        }
      }
    });

    return {
      success: true,
      totalProcessed: input.products.length,
      created: createdCount,
      updated: updatedCount,
    };
  }

  static async deleteProduct(id: string, organizationId: string) {
    const existing = await prisma.product.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new AppError('Product not found in your organization.', 404);
    }

    await prisma.product.delete({
      where: { id },
    });

    return { message: 'Product deleted successfully', id };
  }
}
