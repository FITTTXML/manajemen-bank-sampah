import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.BACKEND_PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
import path from 'path';
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Test Route
app.get('/', (req, res) => {
  res.json({ message: 'SiBankSampah API is running successfully' });
});

// Import Routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import adminRoutes from './routes/admin.routes';
import jenisSampahRoutes from './routes/jenis-sampah.routes';
import laporanRoutes from './routes/laporan.routes';
import nasabahRoutes from './routes/nasabah.routes';
import petugasRoutes from './routes/petugas.routes';
import whatsappRoutes from './routes/whatsapp.routes';
import pengaduanRoutes from './routes/pengaduan.routes';
import penjemputanRoutes from './routes/penjemputan.routes';
import pemilahanRoutes from './routes/pemilahan.routes';

// Mount Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/jenis-sampah', jenisSampahRoutes);
app.use('/api/v1/laporan', laporanRoutes);
app.use('/api/v1/nasabah', nasabahRoutes);
app.use('/api/v1/petugas', petugasRoutes);
app.use('/api/v1/wa', whatsappRoutes);
app.use('/api/v1/pengaduan', pengaduanRoutes);
app.use('/api/v1/penjemputan', penjemputanRoutes);
app.use('/api/v1/pemilahan', pemilahanRoutes);

// Error Handling Middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: err.message || 'Internal Server Error'
  });
});

process.on('exit', (code) => {
  console.log(`Process is exiting with code: ${code}`);
});
process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
  console.log('Uncaught Exception:', err);
});

import { waService } from './services/whatsapp.service';
import { initCronJobs } from './services/cron.service';

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  // Initialize WhatsApp AFTER server is ready (non-blocking)
  waService.init().catch(err => console.error('[WA] Init failed, server continues:', err));
  
  // Initialize cron jobs
  initCronJobs();
});

server.on('close', () => {
  console.log('Server is closed');
});

setInterval(() => {
  // Keep alive
}, 1000 * 60 * 60);
