import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/orderService';
import { createOrderSchema } from '../validators/orderValidator';

export class OrderController {
  static async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.organizationId!;
      const userEmail = req.user?.email || 'Store Staff';
      const validated = createOrderSchema.parse(req.body);

      const order = await OrderService.createOrder(organizationId, validated, userEmail);
      return res.status(201).json({
        success: true,
        message: 'Order created and stock adjusted successfully',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.organizationId!;
      const orders = await OrderService.getOrders(organizationId);
      return res.status(200).json({
        success: true,
        count: orders.length,
        data: orders,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getOrderById(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.organizationId!;
      const id = req.params.id as string;
      const order = await OrderService.getOrderById(id, organizationId);
      return res.status(200).json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }
}
