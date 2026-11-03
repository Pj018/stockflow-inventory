import { prisma } from '../lib/prisma';
import { AppError } from '../middlewares/errorHandler';
import { CreateProductInput, UpdateProductInput } from '../validators/productValidator';

export class ProductService {
  static async getProducts(organizationId: string, search?: string, lowStockOnly = false) {
    // Retrieve organization default threshold
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { defaultLowStockThreshold: true },
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
      ];
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
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
        stockLogs: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product) {
      throw new AppError('Product not found in your organization.', 404);
    }

    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { defaultLowStockThreshold: true },
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
        description: data.description ? data.description.trim() : null,
        quantity: data.quantity ?? 0,
        costPrice: data.costPrice ?? null,
        sellingPrice: data.sellingPrice ?? null,
        lowStockThreshold: data.lowStockThreshold ?? null,
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
          description: data.description !== undefined ? data.description : undefined,
          quantity: data.quantity !== undefined ? data.quantity : undefined,
          costPrice: data.costPrice !== undefined ? data.costPrice : undefined,
          sellingPrice: data.sellingPrice !== undefined ? data.sellingPrice : undefined,
          lowStockThreshold: data.lowStockThreshold !== undefined ? data.lowStockThreshold : undefined,
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
