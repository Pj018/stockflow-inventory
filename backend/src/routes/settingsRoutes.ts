import { Router } from 'express';
import { SettingsController } from '../controllers/settingsController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);
router.get('/', SettingsController.getSettings);
router.put('/', SettingsController.updateSettings);

export default router;
