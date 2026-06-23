import { Router } from 'express';
import { 
  getAllJenisSampah, 
  createJenisSampah, 
  updateJenisSampah, 
  deleteJenisSampah 
} from '../controllers/jenis-sampah.controller';
import { verifyToken, requireRole } from '../middleware/auth';

const router = Router();

// Endpoint publik atau petugas untuk melihat daftar harga bisa dipisah, tapi untuk sekarang kita gabung
router.use(verifyToken);

router.get('/', getAllJenisSampah);

// Restricted to Admin & Petugas (Petugas can't delete)
router.post('/', requireRole(['admin', 'petugas']), createJenisSampah);
router.put('/:id', requireRole(['admin', 'petugas']), updateJenisSampah);
router.delete('/:id', requireRole(['admin']), deleteJenisSampah);

export default router;
