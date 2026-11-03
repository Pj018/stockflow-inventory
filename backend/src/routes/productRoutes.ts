import { Router } from 'express';
import { ProductController } from '../controllers/productController';
import { authenticate } from '../middlewares/auth';

const router = Router();

// Protect all product routes with tenant authentication
router.use(authenticate);

router.get('/', ProductController.getProducts);
router.post('/', ProductController.createProduct);
router.get('/:id', ProductController.getProductById);
router.put('/:id', ProductController.updateProduct);
router.post('/:id/adjust-stock', ProductController.adjustStock);
router.delete('/:id', ProductController.deleteProduct);

export default router;
