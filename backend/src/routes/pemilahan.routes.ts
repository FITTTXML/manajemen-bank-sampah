import { Router } from 'express';
import { classifyWaste } from '../controllers/pemilahan.controller';
import { verifyToken, requireRole } from '../middleware/auth';

const router = Router();
router.use(verifyToken);

// Petugas & Admin can classify waste
router.post('/classify', requireRole(['admin', 'petugas', 'nasabah']), classifyWaste);

export default router;
