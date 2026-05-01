import { Request, Response } from 'express';
import { db } from '../db';
import { setoran, detailSetoran, jenisSampah, nasabah, users } from '../db/schema';
import { eq, gte, and, sql } from 'drizzle-orm';

export const getLaporanData = async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as string) || '7d'; // 1d, 7d, 30d, 90d, 180d

    // Calculate start date based on period
    const now = new Date();
    let startDate = new Date();
    let groupFormat: 'hour' | 'day' | 'week' | 'month' = 'day';
    
    switch (period) {
      case '1d': // Hari ini
        startDate.setHours(0, 0, 0, 0);
        groupFormat = 'hour';
        break;
      case '7d': // 7 hari terakhir
        startDate.setDate(now.getDate() - 7);
        groupFormat = 'day';
        break;
      case '30d': // 30 hari terakhir
        startDate.setDate(now.getDate() - 30);
        groupFormat = 'day';
        break;
      case '90d': // 3 bulan terakhir
        startDate.setDate(now.getDate() - 90);
        groupFormat = 'week';
        break;
      case '180d': // 6 bulan terakhir
        startDate.setDate(now.getDate() - 180);
        groupFormat = 'month';
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // 1. Distribusi Kategori (Pie Chart Data) - filtered by period
    const kategoriDistribution = await db
      .select({
        kategori: jenisSampah.kategori,
        totalBerat: sql<number>`sum(${detailSetoran.beratKg})`,
      })
      .from(detailSetoran)
      .innerJoin(jenisSampah, eq(detailSetoran.jenisSampahId, jenisSampah.id))
      .innerJoin(setoran, eq(detailSetoran.setoranId, setoran.id))
      .where(gte(setoran.tanggal, startDate))
      .groupBy(jenisSampah.kategori);

    const pieChartData = kategoriDistribution.map((item) => ({
      name: item.kategori,
      value: Number(item.totalBerat) || 0,
    }));

    // 2. Trend data - fetch raw data in period range
    const rawDetails = await db
      .select({
        tanggal: setoran.tanggal,
        kategori: jenisSampah.kategori,
        beratKg: detailSetoran.beratKg,
      })
      .from(detailSetoran)
      .innerJoin(setoran, eq(detailSetoran.setoranId, setoran.id))
      .innerJoin(jenisSampah, eq(detailSetoran.jenisSampahId, jenisSampah.id))
      .where(gte(setoran.tanggal, startDate));

    // Group data based on period format
    const trendMap: Record<string, any> = {};
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];

    const getGroupKey = (date: Date): string => {
      switch (groupFormat) {
        case 'hour': {
          const h = date.getHours();
          return `${h.toString().padStart(2, '0')}:00`;
        }
        case 'day': {
          return `${date.getDate()} ${monthNames[date.getMonth()]}`;
        }
        case 'week': {
          // Get ISO week start
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          return `${weekStart.getDate()} ${monthNames[weekStart.getMonth()]}`;
        }
        case 'month': {
          return `${monthNames[date.getMonth()]} ${date.getFullYear().toString().slice(-2)}`;
        }
        default:
          return date.toLocaleDateString('id-ID');
      }
    };

    // Initialize all buckets
    if (groupFormat === 'hour') {
      for (let h = 0; h < 24; h++) {
        const key = `${h.toString().padStart(2, '0')}:00`;
        trendMap[key] = { name: key, organik: 0, plastik: 0, kertas: 0, logam: 0, elektronik: 0, kain: 0, lainnya: 0 };
      }
    } else if (groupFormat === 'day') {
      const days = period === '30d' ? 30 : 7;
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = getGroupKey(d);
        trendMap[key] = { name: key, organik: 0, plastik: 0, kertas: 0, logam: 0, elektronik: 0, kain: 0, lainnya: 0 };
      }
    } else if (groupFormat === 'week') {
      for (let i = 12; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - (i * 7));
        const key = getGroupKey(d);
        if (!trendMap[key]) {
          trendMap[key] = { name: `Mgg ${key}`, organik: 0, plastik: 0, kertas: 0, logam: 0, elektronik: 0, kain: 0, lainnya: 0 };
        }
      }
    } else if (groupFormat === 'month') {
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = getGroupKey(d);
        trendMap[key] = { name: key, organik: 0, plastik: 0, kertas: 0, logam: 0, elektronik: 0, kain: 0, lainnya: 0 };
      }
    }

    // Fill in actual data
    rawDetails.forEach(row => {
      const key = getGroupKey(new Date(row.tanggal));
      if (trendMap[key] && row.kategori) {
        trendMap[key][row.kategori as string] = (trendMap[key][row.kategori as string] || 0) + Number(row.beratKg);
      }
    });

    const trendData = Object.values(trendMap);

    // 3. Summary totals for the period
    const totalBeratPeriod = rawDetails.reduce((sum, r) => sum + Number(r.beratKg), 0);
    const totalSetoranPeriod = new Set(rawDetails.map(r => r.tanggal.toISOString().split('T')[0])).size;

    // 4. Data Nasabah & Transaksi Terbaru (untuk PDF)
    const recentTransactions = await db
      .select({
        id: setoran.id,
        tanggal: setoran.tanggal,
        nasabahNama: users.namaLengkap,
        totalBerat: sql<number>`sum(${detailSetoran.beratKg})`,
        totalNilai: setoran.totalNilai,
      })
      .from(setoran)
      .innerJoin(nasabah, eq(setoran.nasabahId, nasabah.id))
      .innerJoin(users, eq(nasabah.userId, users.id))
      .innerJoin(detailSetoran, eq(setoran.id, detailSetoran.setoranId))
      .where(gte(setoran.tanggal, startDate))
      .groupBy(setoran.id, setoran.tanggal, users.namaLengkap, setoran.totalNilai)
      .orderBy(sql`${setoran.tanggal} DESC`)
      .limit(10);

    const topNasabahRaw = await db
      .select({
        nama: users.namaLengkap,
        noAnggota: nasabah.noAnggota,
        totalSetoran: sql<number>`count(distinct ${setoran.id})`,
        totalBerat: sql<number>`sum(${detailSetoran.beratKg})`,
        totalNilai: sql<number>`sum(${setoran.totalNilai})`,
      })
      .from(setoran)
      .innerJoin(nasabah, eq(setoran.nasabahId, nasabah.id))
      .innerJoin(users, eq(nasabah.userId, users.id))
      .innerJoin(detailSetoran, eq(setoran.id, detailSetoran.setoranId))
      .where(gte(setoran.tanggal, startDate))
      .groupBy(users.namaLengkap, nasabah.noAnggota)
      .orderBy(sql`sum(${detailSetoran.beratKg}) DESC`)
      .limit(5);

    const topNasabah = topNasabahRaw.map(t => ({
      ...t,
      totalSetoran: Number(t.totalSetoran) || 0,
      totalBerat: Number(t.totalBerat) || 0,
      totalNilai: Number(t.totalNilai) || 0
    }));

    res.json({
      message: 'Data laporan berhasil diambil',
      data: {
        period,
        distribusiKategori: pieChartData,
        trenData: trendData,
        recentTransactions: recentTransactions.map(t => ({...t, totalBerat: Number(t.totalBerat)})),
        topNasabah,
        ringkasan: {
          totalBerat: Math.round(totalBeratPeriod * 100) / 100,
          totalHariAktif: totalSetoranPeriod,
          jumlahTransaksi: rawDetails.length,
        }
      }
    });

  } catch (error: any) {
    console.error("Laporan error:", error);
    res.status(500).json({ message: 'Gagal mengambil data laporan', error: error.message });
  }
};
