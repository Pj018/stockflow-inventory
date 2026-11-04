import { prisma } from '../lib/prisma';

export class DashboardService {
  static async getMetrics(organizationId: string) {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        defaultLowStockThreshold: true,
        currencySymbol: true,
        currency: true,
        taxRate: true,
      },
    });

    const defaultThreshold = org?.defaultLowStockThreshold ?? 5;

    const [products, orders] = await Promise.all([
      prisma.product.findMany({
        where: { organizationId },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.order.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
        },
      }),
    ]);

    const totalProducts = products.length;

    let totalQuantity = 0;
    let totalCostValuation = 0;
    let totalSellingValuation = 0;
    const lowStockItems: any[] = [];

    for (const p of products) {
      totalQuantity += p.quantity;
      if (p.costPrice !== null && p.costPrice !== undefined) {
        totalCostValuation += p.quantity * p.costPrice;
      }
      if (p.sellingPrice !== null && p.sellingPrice !== undefined) {
        totalSellingValuation += p.quantity * p.sellingPrice;
      }

      const threshold =
        p.lowStockThreshold !== null && p.lowStockThreshold !== undefined
          ? p.lowStockThreshold
          : defaultThreshold;

      if (p.quantity <= threshold) {
        lowStockItems.push({
          id: p.id,
          name: p.name,
          sku: p.sku,
          quantity: p.quantity,
          lowStockThreshold: threshold,
          sellingPrice: p.sellingPrice,
          costPrice: p.costPrice,
          lastUpdatedBy: p.lastUpdatedBy,
          updatedAt: p.updatedAt,
        });
      }
    }

    // Calculate Sales & Revenue metrics
    const totalOrdersCount = orders.length;
    let totalRevenue = 0;
    let totalEstimatedCOGS = 0;

    for (const order of orders) {
      totalRevenue += order.totalAmount;
      for (const item of order.items) {
        if (item.costPrice !== null && item.costPrice !== undefined) {
          totalEstimatedCOGS += item.costPrice * item.quantity;
        }
      }
    }

    const estimatedGrossProfit = totalRevenue - totalEstimatedCOGS;

    return {
      organization: org,
      summary: {
        totalProducts,
        totalQuantity,
        totalCostValuation: Math.round(totalCostValuation * 100) / 100,
        totalSellingValuation: Math.round(totalSellingValuation * 100) / 100,
        lowStockCount: lowStockItems.length,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalOrdersCount,
        estimatedGrossProfit: Math.round(estimatedGrossProfit * 100) / 100,
      },
      lowStockItems,
      recentProducts: products.slice(0, 5),
      recentOrders: orders.slice(0, 5),
    };
  }
}
