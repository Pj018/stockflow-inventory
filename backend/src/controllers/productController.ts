import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/productService';
import {
  createProductSchema,
  updateProductSchema,
  adjustStockSchema,
  bulkImportSchema,
} from '../validators/productValidator';

export class ProductController {
  static async getProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.organizationId!;
      const search = req.query.search as string | undefined;
      const lowStockOnly = req.query.lowStockOnly === 'true';

      const products = await ProductService.getProducts(organizationId, search, lowStockOnly);
      return res.status(200).json({
        success: true,
        count: products.length,
        data: products,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProductById(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.organizationId!;
      const id = req.params.id as string;

      const product = await ProductService.getProductById(id, organizationId);
      return res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.organizationId!;
      const userEmail = req.user?.email || 'System';
      const validated = createProductSchema.parse(req.body);

      const product = await ProductService.createProduct(
        organizationId,
        validated,
        userEmail
      );

      return res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.organizationId!;
      const id = req.params.id as string;
      const userEmail = req.user?.email || 'System';
      const validated = updateProductSchema.parse(req.body);

      const product = await ProductService.updateProduct(
        id,
        organizationId,
        validated,
        userEmail
      );

      return res.status(200).json({
        success: true,
        message: 'Product updated successfully',
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  static async adjustStock(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.organizationId!;
      const id = req.params.id as string;
      const userEmail = req.user?.email || 'System';
      const validated = adjustStockSchema.parse(req.body);

      const result = await ProductService.adjustStock(
        id,
        organizationId,
        validated.changeAmount,
        validated.note,
        userEmail
      );

      return res.status(200).json({
        success: true,
        message: 'Stock adjusted successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.organizationId!;
      const id = req.params.id as string;

      const result = await ProductService.deleteProduct(id, organizationId);
      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  static async bulkImport(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.organizationId!;
      const userEmail = req.user?.email || 'Store Staff';
      const validated = bulkImportSchema.parse(req.body);

      const result = await ProductService.bulkImport(organizationId, validated, userEmail);
      return res.status(200).json({
        success: true,
        message: `Successfully imported ${result.totalProcessed} products (${result.created} created, ${result.updated} updated)`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
