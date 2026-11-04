import { Router } from 'express';
import { OrderController } from '../controllers/orderController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/', OrderController.getOrders);
router.get('/:id', OrderController.getOrderById);
router.post('/', OrderController.createOrder);

export default router;
