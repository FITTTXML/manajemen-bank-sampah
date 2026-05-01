import { Router } from 'express';
import { getAllPenarikan, updateStatusPenarikan, getMyPenarikan, createPenarikan } from '../controllers/penarikan.controller';
import { verifyToken, requireRole } from '../middleware/auth';

const router = Router();
router.use(verifyToken);

router.get('/', requireRole(['admin', 'petugas']), getAllPenarikan);
router.put('/:id/status', requireRole(['admin', 'petugas']), updateStatusPenarikan);

router.get('/me', requireRole(['nasabah']), getMyPenarikan);
router.post('/', requireRole(['nasabah']), createPenarikan);

export default router;
