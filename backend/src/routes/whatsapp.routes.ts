import { Router } from 'express';
import { waService } from '../services/whatsapp.service';

const router = Router();

// Endpoint for Admin to check WA status and GET QR Code
router.get('/status', (req, res) => {
  const status = waService.getStatus();
  res.json({
    success: true,
    data: status
  });
});

// Endpoint for Admin to test WA sending
router.post('/test-send', async (req, res) => {
  const { number, text } = req.body;
  if (!number || !text) {
    return res.status(400).json({ success: false, message: 'Nomor dan pesan harus diisi.' });
  }

  const success = await waService.sendMessage(number, text);
  if (success) {
    return res.json({ success: true, message: 'Pesan berhasil dikirim.' });
  } else {
    return res.status(500).json({ success: false, message: 'Gagal mengirim pesan (mungkin WA belum terkoneksi).' });
  }
});

// Endpoint for Admin to reset/clear WA session
router.delete('/reset-session', async (req, res) => {
  try {
    await waService.resetSession();
    res.json({ success: true, message: 'Sesi WhatsApp berhasil dihapus. Silakan scan QR Code baru.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Gagal mereset sesi WA', error: error.message });
  }
});

export default router;
