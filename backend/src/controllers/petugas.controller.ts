import { Request, Response } from 'express';
import { db } from '../db';
import { penjemputan, detailPenjemputan, nasabah, users } from '../db/schema';
import { eq, desc, and, gte, sql } from 'drizzle-orm';
import { startOfDay, endOfDay } from 'date-fns';

export const getDashboardPetugas = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    const start = startOfDay(today);
    const end = endOfDay(today);

    // Total Nasabah Dilayani Hari Ini (Penjemputan)
    const penjemputanHariIni = await db.select({ nasabahId: penjemputan.nasabahId })
      .from(penjemputan)
      .where(and(gte(penjemputan.createdAt, start), sql`${penjemputan.createdAt} <= ${end}`));
    
    const uniqueNasabahIds = new Set(penjemputanHariIni.map((p) => p.nasabahId));
    const totalNasabahDilayani = uniqueNasabahIds.size;

    // Total Berat Sampah Dijemput Hari Ini
    const detailPenjemputanHariIni = await db.select({ berat: detailPenjemputan.beratKg })
      .from(detailPenjemputan)
      .innerJoin(penjemputan, eq(detailPenjemputan.penjemputanId, penjemputan.id))
      .where(and(gte(penjemputan.createdAt, start), sql`${penjemputan.createdAt} <= ${end}`));
    
    const totalSetoranKg = detailPenjemputanHariIni.reduce((acc, curr) => acc + Number(curr.berat), 0);

    // Total Pendapatan Jasa Hari Ini (yg lunas)
    const penjemputanSelesai = await db.select({ totalBiaya: penjemputan.totalBiaya })
      .from(penjemputan)
      .where(and(eq(penjemputan.statusPembayaran, 'lunas'), gte(penjemputan.createdAt, start), sql`${penjemputan.createdAt} <= ${end}`));
    
    const totalPenarikanTunai = penjemputanSelesai.reduce((acc, curr) => acc + Number(curr.totalBiaya), 0);

    // Riwayat Transaksi Hari Ini (Penjemputan)
    const penjemputanList = await db.select({
      id: penjemputan.id,
      jenis: sql`'Penjemputan'`,
      jumlahOrBerat: penjemputan.totalBiaya, 
      createdAt: penjemputan.createdAt,
      namaNasabah: users.namaLengkap
    })
    .from(penjemputan)
    .innerJoin(nasabah, eq(nasabah.id, penjemputan.nasabahId))
    .innerJoin(users, eq(users.id, nasabah.userId))
    .where(and(gte(penjemputan.createdAt, start), sql`${penjemputan.createdAt} <= ${end}`))
    .orderBy(desc(penjemputan.createdAt))
    .limit(10);

    const riwayatHarian = penjemputanList.map(item => ({
      time: new Date(item.createdAt as any).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      name: item.namaNasabah,
      type: item.jenis,
      detail: `(Tagihan: Rp ${Number(item.jumlahOrBerat).toLocaleString('id-ID')})`
    }));

    res.json({
      message: 'Dashboard petugas fetched successfully',
      data: {
        nasabahDilayani: totalNasabahDilayani,
        totalSetoranKg: totalSetoranKg,
        penarikanTunai: totalPenarikanTunai, // Keep variable name for frontend compatibility or change if front is updated
        riwayatHarian: riwayatHarian
      }
    });

  } catch (error: any) {
    res.status(500).json({ message: 'Gagal mengambil data dashboard petugas', error: error.message });
  }
};
