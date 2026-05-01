import { Router } from 'express';
import { getLaporanData } from '../controllers/laporan.controller';
import { verifyToken, requireRole } from '../middleware/auth';

const router = Router();

// Routes for Laporan Analytics
router.get('/', verifyToken, requireRole(['admin']), getLaporanData);

export default router;
