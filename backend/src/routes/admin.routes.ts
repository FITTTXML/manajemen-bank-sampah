import { Router } from 'express';
import { getDashboardStats } from '../controllers/admin.controller';
import { verifyToken, requireRole } from '../middleware/auth';

const router = Router();

// Only admin can access dashboard summary api
router.use(verifyToken, requireRole(['admin']));

router.get('/stats', getDashboardStats);

export default router;
