import cron from 'node-cron';
import puppeteer from 'puppeteer';
import { db } from '../db';
import { penjemputan, users } from '../db/schema';
import { eq, and, gte, lt } from 'drizzle-orm';
import { waService } from './whatsapp.service';

export const generateAndSendMonthlyReport = async () => {
  console.log('[REPORT] Generating monthly report...');
  
  // Calculate date range for previous month
  const now = new Date();
  const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  
  const monthName = firstDayLastMonth.toLocaleString('id-ID', { month: 'long', year: 'numeric' });

  // Fetch data
  const pickups = await db.query.penjemputan.findMany({
    where: and(
      gte(penjemputan.tanggalRequest, firstDayLastMonth),
      lt(penjemputan.tanggalRequest, firstDayThisMonth),
      eq(penjemputan.status, 'selesai')
    ),
    with: {
      nasabahRef: { with: { user: true } }
    }
  });

  const totalRevenue = pickups.reduce((sum, p) => sum + Number(p.totalBiaya || 0), 0);
  const totalPickups = pickups.length;

  // Generate HTML
  const htmlContent = `
    <html>
      <head>
        <style>
          body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #333; }
          .header { text-align: center; border-bottom: 2px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: bold; color: #065f46; margin: 0; }
          .subtitle { font-size: 14px; color: #6b7280; margin-top: 5px; }
          .summary-cards { display: flex; gap: 20px; margin-bottom: 30px; }
          .card { background: #f0fdf4; border: 1px solid #a7f3d0; padding: 20px; border-radius: 8px; flex: 1; text-align: center; }
          .card-value { font-size: 24px; font-weight: bold; color: #047857; margin: 10px 0 0 0; }
          .card-label { font-size: 12px; text-transform: uppercase; color: #065f46; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
          th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; }
          th { background-color: #f9fafb; color: #374151; }
          .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #9ca3af; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">Laporan Layanan SiBankSampah</h1>
          <p class="subtitle">Periode: ${monthName}</p>
        </div>
        
        <div class="summary-cards">
          <div class="card">
            <div class="card-label">Total Penjemputan Selesai</div>
            <p class="card-value">${totalPickups}</p>
          </div>
          <div class="card">
            <div class="card-label">Total Pendapatan Jasa</div>
            <p class="card-value">Rp ${totalRevenue.toLocaleString('id-ID')}</p>
          </div>
        </div>

        <h3>Rincian Penjemputan Selesai</h3>
        <table>
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Nasabah</th>
              <th>Alamat</th>
              <th>Pendapatan</th>
            </tr>
          </thead>
          <tbody>
            ${pickups.map(p => `
              <tr>
                <td>${p.tanggalRequest.toLocaleDateString('id-ID')}</td>
                <td>${p.nasabahRef?.user?.namaLengkap || '-'}</td>
                <td>${p.alamat}</td>
                <td>Rp ${Number(p.totalBiaya || 0).toLocaleString('id-ID')}</td>
              </tr>
            `).join('')}
            ${pickups.length === 0 ? '<tr><td colspan="4" style="text-align: center;">Tidak ada data penjemputan di bulan ini</td></tr>' : ''}
          </tbody>
        </table>

        <div class="footer">
          Digenerate secara otomatis oleh Sistem SiBankSampah pada ${now.toLocaleString('id-ID')}
        </div>
      </body>
    </html>
  `;

  // Render to PDF
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });
  const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
  await browser.close();

  // Send to all Admins
  const admins = await db.query.users.findMany({ where: eq(users.role, 'admin') });
  const caption = `📊 *Laporan Bulanan SiBankSampah*\n\nBerikut terlampir laporan layanan penjemputan untuk periode *${monthName}*.\n\nTotal Penjemputan: ${totalPickups}\nTotal Pendapatan: Rp ${totalRevenue.toLocaleString('id-ID')}`;

  for (const admin of admins) {
    if (admin.nomorHp) {
      await waService.sendDocument(
        admin.nomorHp, 
        Buffer.from(pdfBuffer), 
        `Laporan_SiBankSampah_${monthName.replace(' ', '_')}.pdf`, 
        caption
      );
    }
  }
  
  console.log('[REPORT] Monthly report generated and sent successfully.');
  return { success: true, message: 'Report generated and sent.' };
};

export const initCronJobs = () => {
  // Run on the 1st of every month at 08:00 AM
  cron.schedule('0 8 1 * *', async () => {
    console.log('[CRON] Starting monthly report generation...');
    try {
      await generateAndSendMonthlyReport();
    } catch (error) {
      console.error('[CRON] Error generating monthly report:', error);
    }
  });
  console.log('[CRON] Jobs initialized successfully.');
};
