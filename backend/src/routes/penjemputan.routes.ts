import { Router } from 'express';
import { createPenjemputan, getMyPenjemputan, getAllPenjemputan, prosesTagihanPenjemputan, pembayaranTransfer, verifikasiPembayaran, terimaPenjemputan } from '../controllers/penjemputan.controller';
import { verifyToken, requireRole } from '../middleware/auth';
import { uploadBukti } from '../middleware/upload';

const router = Router();
router.use(verifyToken);

// Nasabah
router.post('/', requireRole(['nasabah']), createPenjemputan);
router.get('/me', requireRole(['nasabah']), getMyPenjemputan);

router.post('/:id/bayar', requireRole(['nasabah']), uploadBukti.single('buktiPembayaran'), pembayaranTransfer);

// Petugas & Admin
router.get('/', requireRole(['admin', 'petugas']), getAllPenjemputan);
router.patch('/:id/terima', requireRole(['admin', 'petugas']), terimaPenjemputan);
router.post('/:id/tagih', requireRole(['admin', 'petugas']), prosesTagihanPenjemputan);
router.patch('/:id/verifikasi', requireRole(['admin', 'petugas']), verifikasiPembayaran);

export default router;
