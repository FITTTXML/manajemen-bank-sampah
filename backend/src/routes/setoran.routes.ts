import { Router } from 'express';
import { getAllSetoran, createSetoran, getMySetoran } from '../controllers/setoran.controller';
import { verifyToken, requireRole } from '../middleware/auth';

const router = Router();
router.use(verifyToken);

router.get('/', requireRole(['admin', 'petugas']), getAllSetoran);
router.get('/me', requireRole(['nasabah']), getMySetoran);
router.post('/', requireRole(['admin', 'petugas']), createSetoran);

export default router;
