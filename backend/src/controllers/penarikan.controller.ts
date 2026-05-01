import { Request, Response } from 'express';
import { db } from '../db';
import { penarikan, nasabah } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { waService } from '../services/whatsapp.service';
import { users } from '../db/schema';

export const getAllPenarikan = async (req: Request, res: Response) => {
  try {
    const list = await db.query.penarikan.findMany({
      with: {
        nasabah: {
          with: { user: true }
        },
        diproses: true, // as diprosesOleh
      },
      orderBy: [desc(penarikan.diajukanPada)]
    });
    res.json({ message: 'Berhasil mengambil data penarikan', data: list });
  } catch (error: any) {
    res.status(500).json({ message: 'Gagal memuat penarikan', error: error.message });
  }
};

export const getMyPenarikan = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const [nasabahTarget] = await db.select().from(nasabah).where(eq(nasabah.userId, userId)).limit(1);
    if (!nasabahTarget) return res.status(404).json({ message: 'Nasabah tidak ditemukan' });

    const list = await db.query.penarikan.findMany({
      where: eq(penarikan.nasabahId, nasabahTarget.id),
      with: { diproses: true },
      orderBy: [desc(penarikan.diajukanPada)]
    });
    res.json({ message: 'Berhasil mengambil data penarikan pribadi', data: list });
  } catch (error: any) {
    res.status(500).json({ message: 'Gagal memuat penarikan', error: error.message });
  }
};

export const createPenarikan = async (req: Request, res: Response) => {
  try {
    const { jumlah, metode, namaBank, nomorRekening } = req.body;
    const userId = (req as any).user?.id;
    
    const [nasabahTarget] = await db.select().from(nasabah).where(eq(nasabah.userId, userId)).limit(1);
    if (!nasabahTarget) return res.status(404).json({ message: 'Nasabah tidak ditemukan' });

    // Validate Saldo
    const targetJumlah = parseFloat(jumlah);
    const saldoNasabah = parseFloat(nasabahTarget.saldo as string || '0');
    
    if (targetJumlah > saldoNasabah) {
       return res.status(400).json({ message: 'Saldo tidak mencukupi untuk nominal penarikan ini' });
    }

    // Insert
    const [newP] = await db.insert(penarikan).values({
      nasabahId: nasabahTarget.id,
      jumlah: targetJumlah.toString(),
      metode,
      namaBank,
      nomorRekening,
      status: 'menunggu'
    }).returning();

    res.status(201).json({ message: 'Berhasil mengajukan penarikan dana', data: newP });
  } catch (error: any) {
    res.status(500).json({ message: 'Gagal mengajukan penarikan', error: error.message });
  }
};

export const updateStatusPenarikan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, alasanTolak } = req.body;
    const adminId = (req as any).user?.id;

    if (!['disetujui', 'ditolak', 'selesai'].includes(status)) {
      return res.status(400).json({ message: 'Status tidak valid' });
    }

    const [current] = await db.select().from(penarikan).where(eq(penarikan.id, id as string)).limit(1);
    if (!current) return res.status(404).json({ message: 'Pengajuan tidak ditemukan' });

    if (current.status !== 'menunggu') {
      return res.status(400).json({ message: 'Status pengajuan sudah tidak dapat diubah' });
    }

    await db.transaction(async (tx) => {
      // Jika disetujui, kurangi saldo nasabah as actual withdrawal has happened
      if (status === 'disetujui' || status === 'selesai') {
        const [nasabahData] = await tx.select().from(nasabah).where(eq(nasabah.id, current.nasabahId)).limit(1);
        const saldoLama = parseFloat(nasabahData.saldo as string || '0');
        const nominal = parseFloat(current.jumlah as string);
        
        if (saldoLama < nominal) {
          throw new Error('Saldo nasabah tidak mencukupi untuk penarikan ini, reject transaksi.');
        }

        const saldoBaru = saldoLama - nominal;
        await tx.update(nasabah).set({ saldo: saldoBaru.toString() }).where(eq(nasabah.id, current.nasabahId));
      }

      await tx.update(penarikan).set({
        status,
        alasanTolak: status === 'ditolak' ? alasanTolak : null,
        diprosesOleh: adminId,
        diprosesPada: new Date(),
        diselesaikanOleh: status === 'selesai' ? adminId : null,
        diselesaikanPada: status === 'selesai' ? new Date() : null,
      }).where(eq(penarikan.id, id as string));
    });

    res.json({ message: `Pengajuan berhasil ${status}` });

    // Kirim notifikasi WA (Non-blocking)
    if (status === 'disetujui' || status === 'selesai' || status === 'ditolak') {
      try {
        const [nasabahDb] = await db.select({ hp: users.nomorHp, nama: users.namaLengkap })
          .from(nasabah)
          .innerJoin(users, eq(nasabah.userId, users.id))
          .where(eq(nasabah.id, current.nasabahId))
          .limit(1);

        if (nasabahDb && nasabahDb.hp) {
          const pesan = status === 'ditolak'
            ? `Halo ${nasabahDb.nama}, mohon maaf pengajuan penarikan dana Anda sebesar Rp ${current.jumlah} DITOLAK. Alasan: ${alasanTolak || '-'}`
            : `Halo ${nasabahDb.nama}, pengajuan penarikan tunai Anda sebesar Rp ${current.jumlah} DISETUJUI. Silakan temui petugas kami.`;
          waService.sendMessage(nasabahDb.hp, pesan);
        }
      } catch (err) {
        console.error('Gagal mengirim WA Penarikan:', err);
      }
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Gagal mengubah status', error: error.message });
  }
};
