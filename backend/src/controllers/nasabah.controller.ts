import { Request, Response } from 'express';
import { db } from '../db';
import { penjemputan, nasabah, jenisSampah } from '../db/schema';
import { eq, desc, sql } from 'drizzle-orm';

export const getDashboardNasabah = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id; // from JWT token middleware

    // Get nasabah profile
    const profile = await db.select().from(nasabah).where(eq(nasabah.userId, userId)).limit(1);
    if (profile.length === 0) {
      return res.status(404).json({ message: 'Profil nasabah tidak ditemukan' });
    }
    const nasabahId = profile[0].id;
    // Get recent sets of transactions
    const penjemputanList = await db.select({
      id: penjemputan.id,
      jenis: sql`'Penjemputan'`,
      jumlahOrBerat: penjemputan.totalBiaya,
      createdAt: penjemputan.createdAt,
      status: penjemputan.status
    })
    .from(penjemputan)
    .where(eq(penjemputan.nasabahId, nasabahId))
    .orderBy(desc(penjemputan.createdAt))
    .limit(5);

    const aktivitasTerakhir = penjemputanList
      .map(item => ({
        time: new Date(item.createdAt as any).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
        type: item.jenis,
        detail: `Layanan Penjemputan - ${item.status}`,
        amount: Number(item.jumlahOrBerat)
      }));

    // Get current waste prices
    const hargaSampah = await db.select().from(jenisSampah).orderBy(desc(jenisSampah.hargaPerKg)).limit(5);

    res.json({
      message: 'Dashboard nasabah berhasil diambil',
      data: {
        aktivitasTerakhir,
        informasiHargaSampah: hargaSampah.map(s => ({
          type: s.nama,
          price: `Rp ${Number(s.hargaPerKg).toLocaleString('id-ID')}/kg`
        }))
      }
    });

  } catch (error: any) {
    res.status(500).json({ message: 'Gagal mengambil data dashboard nasabah', error: error.message });
  }
};
