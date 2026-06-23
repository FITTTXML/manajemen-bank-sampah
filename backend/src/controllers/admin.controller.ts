import { Request, Response } from 'express';
import { db } from '../db';
import { users, nasabah, penjemputan, detailPenjemputan } from '../db/schema';
import { eq, sql } from 'drizzle-orm';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    // 1. Total Nasabah
    const [{ count: totalNasabah }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, 'nasabah'));

    // 2. Total Berat Sampah Dijemput
    const [{ totalBerat }] = await db
      .select({ totalBerat: sql<number>`sum(${detailPenjemputan.beratKg})` })
      .from(detailPenjemputan);

    // 3. Total Pendapatan Jasa (Lunas)
    const [{ totalPendapatan }] = await db
      .select({ totalPendapatan: sql<number>`sum(${penjemputan.totalBiaya})` })
      .from(penjemputan)
      .where(eq(penjemputan.statusPembayaran, 'lunas'));

    res.json({
      message: 'Statistik dashboard berhasil diambil',
      data: {
        totalNasabah: Number(totalNasabah) || 0,
        totalBeratSampah: Number(totalBerat) || 0,
        totalPendapatan: Number(totalPendapatan) || 0,
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Gagal mengambil statistik', error: error.message });
  }
};
