import { Router } from 'express';
import { createPenjemputan, getMyPenjemputan, getAllPenjemputan, updateStatusPenjemputan } from '../controllers/penjemputan.controller';
import { verifyToken, requireRole } from '../middleware/auth';

const router = Router();
router.use(verifyToken);

// Nasabah
router.post('/', requireRole(['nasabah']), createPenjemputan);
router.get('/me', requireRole(['nasabah']), getMyPenjemputan);

// Petugas & Admin
router.get('/', requireRole(['admin', 'petugas']), getAllPenjemputan);
router.patch('/:id/status', requireRole(['admin', 'petugas']), updateStatusPenjemputan);

export default router;
