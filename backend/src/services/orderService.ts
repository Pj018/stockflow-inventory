import { prisma } from '../lib/prisma';
import { AppError } from '../middlewares/errorHandler';
import { CreateOrderInput } from '../validators/orderValidator';

export class OrderService {
  static async createOrder(
    organizationId: string,
    data: CreateOrderInput,
    userEmail: string
  ) {
    const productIds = data.items.map((i) => i.productId);

    // Fetch all products in one query and verify tenant ownership
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        organizationId,
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Validate that all items exist and have adequate stock
    for (const item of data.items) {
      const prod = productMap.get(item.productId);
      if (!prod) {
        throw new AppError(`Product with ID "${item.productId}" not found in your inventory.`, 404);
      }

      if (prod.quantity < item.quantity) {
        throw new AppError(
          `Insufficient stock for "${prod.name}". Requested ${item.quantity}, but only ${prod.quantity} available.`,
          400
        );
      }
    }

    // Atomic execution: decrement stock, record stock logs, create order & line items
    const order = await prisma.$transaction(async (tx) => {
      // Generate order number
      const count = await tx.order.count({ where: { organizationId } });
      const orderNumber = `ORD-${String(count + 1001).padStart(5, '0')}`;

      let subtotal = 0;
      const orderItemsData = [];

      for (const item of data.items) {
        const prod = productMap.get(item.productId)!;
        const unitPrice = item.unitPrice ?? prod.sellingPrice ?? 0;
        const itemTotal = unitPrice * item.quantity;
        subtotal += itemTotal;

        const previousQty = prod.quantity;
        const newQty = previousQty - item.quantity;

        // Decrement product inventory
        await tx.product.update({
          where: { id: prod.id },
          data: {
            quantity: newQty,
            lastUpdatedBy: userEmail,
          },
        });

        // Create StockLog audit trail
        await tx.stockLog.create({
          data: {
            organizationId,
            productId: prod.id,
            changeAmount: -item.quantity,
            previousQty,
            newQty,
            note: `POS Sale: ${orderNumber}`,
            updatedBy: userEmail,
          },
        });

        orderItemsData.push({
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          quantity: item.quantity,
          unitPrice,
          totalPrice: itemTotal,
          costPrice: prod.costPrice,
        });
      }

      const discount = data.discountAmount || 0;
      const tax = data.taxAmount || 0;
      const totalAmount = Math.max(0, subtotal - discount + tax);

      const createdOrder = await tx.order.create({
        data: {
          organizationId,
          orderNumber,
          customerName: data.customerName?.trim() || null,
          customerPhone: data.customerPhone?.trim() || null,
          paymentMethod: data.paymentMethod || 'CASH',
          subtotal,
          discountAmount: discount,
          taxAmount: tax,
          totalAmount,
          createdBy: userEmail,
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: true,
          organization: {
            select: {
              name: true,
              currencySymbol: true,
              phone: true,
              address: true,
              invoiceFooter: true,
            },
          },
        },
      });

      return createdOrder;
    });

    return order;
  }

  static async getOrders(organizationId: string) {
    const orders = await prisma.order.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
      },
    });

    return orders;
  }

  static async getOrderById(id: string, organizationId: string) {
    const order = await prisma.order.findFirst({
      where: { id, organizationId },
      include: {
        items: true,
        organization: {
          select: {
            name: true,
            currencySymbol: true,
            phone: true,
            address: true,
            invoiceFooter: true,
          },
        },
      },
    });

    if (!order) {
      throw new AppError('Order not found.', 404);
    }

    return order;
  }
}
