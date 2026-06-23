import { Router } from 'express';
import { getLaporanData } from '../controllers/laporan.controller';
import { verifyToken, requireRole } from '../middleware/auth';

const router = Router();

// Routes for Laporan Analytics
router.get('/', verifyToken, requireRole(['admin']), getLaporanData);

// Manual trigger for testing PDF Generation
router.post('/generate-pdf', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { generateAndSendMonthlyReport } = await import('../services/cron.service');
    await generateAndSendMonthlyReport();
    res.json({ success: true, message: 'Laporan PDF sedang di-generate dan akan dikirim ke WhatsApp admin.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
