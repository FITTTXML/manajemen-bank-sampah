import { Request, Response } from 'express';
import { db } from '../db';
import { setoran, detailSetoran, penarikan, nasabah, users } from '../db/schema';
import { eq, desc, and, gte, sql } from 'drizzle-orm';
import { startOfDay, endOfDay } from 'date-fns';

export const getDashboardPetugas = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    const start = startOfDay(today);
    const end = endOfDay(today);

    // Total Nasabah Dilayani Hari Ini (Setoran & Penarikan)
    const setoranHariIni = await db.select({ nasabahId: setoran.nasabahId })
      .from(setoran)
      .where(and(gte(setoran.tanggal, start), sql`${setoran.tanggal} <= ${end}`));
    
    const penarikanHariIni = await db.select({ nasabahId: penarikan.nasabahId })
      .from(penarikan)
      .where(and(gte(penarikan.diajukanPada, start), sql`${penarikan.diajukanPada} <= ${end}`));

    const uniqueNasabahIds = new Set([
      ...setoranHariIni.map((s) => s.nasabahId),
      ...penarikanHariIni.map((p) => p.nasabahId)
    ]);
    const totalNasabahDilayani = uniqueNasabahIds.size;

    // Total Berat Setoran Hari Ini
    const detailSetoranHariIni = await db.select({ berat: detailSetoran.beratKg })
      .from(detailSetoran)
      .innerJoin(setoran, eq(detailSetoran.setoranId, setoran.id))
      .where(and(gte(setoran.tanggal, start), sql`${setoran.tanggal} <= ${end}`));
    
    const totalSetoranKg = detailSetoranHariIni.reduce((acc, curr) => acc + Number(curr.berat), 0);

    // Total Penarikan Tunai Hari Ini (yg selesai)
    const penarikanSelesai = await db.select({ jumlah: penarikan.jumlah })
      .from(penarikan)
      .where(and(eq(penarikan.status, 'selesai'), gte(penarikan.diselesaikanPada, start), sql`${penarikan.diselesaikanPada} <= ${end}`));
    
    const totalPenarikanTunai = penarikanSelesai.reduce((acc, curr) => acc + Number(curr.jumlah), 0);

    // Riwayat Transaksi Hari Ini (Gabungan Setoran dan Penarikan)
    const setoranList = await db.select({
      id: setoran.id,
      jenis: sql`'Setoran'`,
      jumlahOrBerat: setoran.totalNilai, // or we can say Setoran
      createdAt: setoran.tanggal,
      namaNasabah: users.namaLengkap
    })
    .from(setoran)
    .innerJoin(nasabah, eq(nasabah.id, setoran.nasabahId))
    .innerJoin(users, eq(users.id, nasabah.userId))
    .where(and(gte(setoran.tanggal, start), sql`${setoran.tanggal} <= ${end}`))
    .orderBy(desc(setoran.tanggal))
    .limit(10);

    const penarikanList = await db.select({
      id: penarikan.id,
      jenis: sql`'Penarikan'`,
      jumlahOrBerat: penarikan.jumlah,
      createdAt: penarikan.diajukanPada,
      namaNasabah: users.namaLengkap
    })
    .from(penarikan)
    .innerJoin(nasabah, eq(nasabah.id, penarikan.nasabahId))
    .innerJoin(users, eq(users.id, nasabah.userId))
    .where(and(gte(penarikan.diajukanPada, start), sql`${penarikan.diajukanPada} <= ${end}`))
    .orderBy(desc(penarikan.diajukanPada))
    .limit(10);

    const riwayatHarian = [...setoranList, ...penarikanList]
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, 10);

    res.json({
      message: 'Dashboard petugas fetched successfully',
      data: {
        nasabahDilayani: totalNasabahDilayani,
        totalSetoranKg: totalSetoranKg,
        penarikanTunai: totalPenarikanTunai,
        riwayatHarian: riwayatHarian.map(item => ({
          time: new Date(item.createdAt as any).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          name: item.namaNasabah,
          type: item.jenis,
          detail: item.jenis === 'Setoran' ? `(+Rp ${Number(item.jumlahOrBerat).toLocaleString('id-ID')})` : `(-Rp ${Number(item.jumlahOrBerat).toLocaleString('id-ID')})`
        }))
      }
    });

  } catch (error: any) {
    res.status(500).json({ message: 'Gagal mengambil data dashboard petugas', error: error.message });
  }
};
