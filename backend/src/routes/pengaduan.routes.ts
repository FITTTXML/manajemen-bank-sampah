import { Router } from 'express';
import { createPengaduan, getMyPengaduan, getAllPengaduan, balasPengaduan } from '../controllers/pengaduan.controller';
import { verifyToken, requireRole } from '../middleware/auth';

const router = Router();
router.use(verifyToken);

// Routes for Nasabah and Petugas
router.post('/', createPengaduan);
router.get('/me', getMyPengaduan);

// Routes for Admin
router.get('/all', requireRole(['admin']), getAllPengaduan);
router.put('/:id/balas', requireRole(['admin']), balasPengaduan);

export default router;
