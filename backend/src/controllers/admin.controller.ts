import { Request, Response } from 'express';
import { db } from '../db';
import { users, nasabah, setoran, detailSetoran } from '../db/schema';
import { eq, sql } from 'drizzle-orm';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    // 1. Total Nasabah
    const [{ count: totalNasabah }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, 'nasabah'));

    // 2. Total Berat Sampah Setoran
    const [{ totalBerat }] = await db
      .select({ totalBerat: sql<number>`sum(${detailSetoran.beratKg})` })
      .from(detailSetoran);

    // 3. Total Saldo Beredar (Nasabah)
    const [{ totalSaldo }] = await db
      .select({ totalSaldo: sql<number>`sum(${nasabah.saldo})` })
      .from(nasabah);

    res.json({
      message: 'Statistik dashboard berhasil diambil',
      data: {
        totalNasabah: Number(totalNasabah) || 0,
        totalBeratSampah: Number(totalBerat) || 0,
        totalSaldoBeredar: Number(totalSaldo) || 0,
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Gagal mengambil statistik', error: error.message });
  }
};
