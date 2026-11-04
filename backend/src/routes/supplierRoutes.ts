import { Router } from 'express';
import { SupplierController } from '../controllers/supplierController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/', SupplierController.getSuppliers);
router.post('/', SupplierController.createSupplier);
router.put('/:id', SupplierController.updateSupplier);
router.delete('/:id', SupplierController.deleteSupplier);

export default router;
