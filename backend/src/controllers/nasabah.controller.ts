import { Request, Response } from 'express';
import { db } from '../db';
import { setoran, penarikan, nasabah, jenisSampah } from '../db/schema';
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
    const saldoAktif = profile[0].saldo;

    // Get recent sets of transactions
    const setoranList = await db.select({
      id: setoran.id,
      jenis: sql`'Setoran'`,
      jumlahOrBerat: setoran.totalNilai,
      createdAt: setoran.tanggal
    })
    .from(setoran)
    .where(eq(setoran.nasabahId, nasabahId))
    .orderBy(desc(setoran.tanggal))
    .limit(5);

    const penarikanList = await db.select({
      id: penarikan.id,
      jenis: sql`'Penarikan'`,
      jumlahOrBerat: penarikan.jumlah,
      createdAt: penarikan.diajukanPada
    })
    .from(penarikan)
    .where(eq(penarikan.nasabahId, nasabahId))
    .orderBy(desc(penarikan.diajukanPada))
    .limit(5);

    const aktivitasTerakhir = [...setoranList, ...penarikanList]
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, 5)
      .map(item => ({
        time: new Date(item.createdAt as any).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
        type: item.jenis,
        detail: item.jenis === 'Setoran' ? `Setoran Sampah` : `Penarikan Tunai`,
        amount: Number(item.jumlahOrBerat)
      }));

    // Get current waste prices
    const hargaSampah = await db.select().from(jenisSampah).orderBy(desc(jenisSampah.hargaPerKg)).limit(5);

    res.json({
      message: 'Dashboard nasabah berhasil diambil',
      data: {
        saldoAktif,
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
