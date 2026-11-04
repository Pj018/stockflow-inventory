import { Request, Response, NextFunction } from 'express';
import { SupplierService } from '../services/supplierService';
import { createSupplierSchema, updateSupplierSchema } from '../validators/supplierValidator';

export class SupplierController {
  static async getSuppliers(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.organizationId!;
      const suppliers = await SupplierService.getSuppliers(organizationId);
      return res.status(200).json({
        success: true,
        count: suppliers.length,
        data: suppliers,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createSupplier(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.organizationId!;
      const validated = createSupplierSchema.parse(req.body);
      const supplier = await SupplierService.createSupplier(organizationId, validated);
      return res.status(201).json({
        success: true,
        message: 'Supplier created successfully',
        data: supplier,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateSupplier(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.organizationId!;
      const id = req.params.id as string;
      const validated = updateSupplierSchema.parse(req.body);
      const updated = await SupplierService.updateSupplier(id, organizationId, validated);
      return res.status(200).json({
        success: true,
        message: 'Supplier updated successfully',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteSupplier(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.organizationId!;
      const id = req.params.id as string;
      const result = await SupplierService.deleteSupplier(id, organizationId);
      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}
