import { Router } from 'express';
import { getDashboardNasabah } from '../controllers/nasabah.controller';
import { verifyToken, requireRole } from '../middleware/auth';

const router = Router();

// Nasabah dashboard stats
router.get('/dashboard', verifyToken, requireRole(['nasabah']), getDashboardNasabah);

export default router;
