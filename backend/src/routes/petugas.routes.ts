import { Router } from 'express';
import { getDashboardPetugas } from '../controllers/petugas.controller';
import { verifyToken, requireRole } from '../middleware/auth';

const router = Router();

// Petugas dashboard stats
router.get('/dashboard', verifyToken, requireRole(['admin', 'petugas']), getDashboardPetugas);

export default router;
