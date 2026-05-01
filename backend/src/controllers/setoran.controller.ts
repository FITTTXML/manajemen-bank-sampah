import { Request, Response } from 'express';
import { db } from '../db';
import { setoran, detailSetoran, nasabah, jenisSampah } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { waService } from '../services/whatsapp.service';
import { users } from '../db/schema';

export const getAllSetoran = async (req: Request, res: Response) => {
  try {
    const data = await db.query.setoran.findMany({
      with: {
        nasabah: {
          with: { user: true }
        },
        details: {
          with: { jenisSampah: true }
        }
      },
      orderBy: [desc(setoran.tanggal)]
    });
    res.json({ message: 'Berhasil mengambil data setoran', data });
  } catch (error: any) {
    res.status(500).json({ message: 'Gagal mengambil setoran', error: error.message });
  }
};

export const getMySetoran = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    // get nasabah target
    const [nasabahTarget] = await db.select().from(nasabah).where(eq(nasabah.userId, userId)).limit(1);
    
    if (!nasabahTarget) {
       return res.status(404).json({ message: 'Profil nasabah tidak ditemukan' });
    }

    const data = await db.query.setoran.findMany({
      where: eq(setoran.nasabahId, nasabahTarget.id),
      with: {
        petugas: true,
        details: {
          with: { jenisSampah: true }
        }
      },
      orderBy: [desc(setoran.tanggal)]
    });
    res.json({ message: 'Berhasil mengambil data setoran', data });
  } catch (error: any) {
    res.status(500).json({ message: 'Gagal mengambil setoran pribadi', error: error.message });
  }
};

export const createSetoran = async (req: Request, res: Response) => {
  try {
    // Expected details: [{ jenisSampahId, beratKg }]
    const { nasabahId, catatan, details } = req.body;
    const petugasId = (req as any).user?.id;

    if (!details || details.length === 0) {
      return res.status(400).json({ message: 'Detail setoran kosong' });
    }

    // 1. Dapatkan informasi nasabah
    const nasabahTarget = await db.select().from(nasabah).where(eq(nasabah.id, nasabahId)).limit(1);
    if (!nasabahTarget.length) {
      return res.status(404).json({ message: 'Nasabah tidak ditemukan' });
    }

    // 2. Transaksi Database
    await db.transaction(async (tx) => {
      let totalNilai = 0;
      const detailInserts = [];

      // Kalkulasi detail
      for (const item of details) {
        const js = await tx.select().from(jenisSampah).where(eq(jenisSampah.id, item.jenisSampahId)).limit(1);
        if (!js.length) throw new Error(`Jenis sampah ID ${item.jenisSampahId} tidak valid`);
        
        const hargaSatuan = parseFloat(js[0].hargaPerKg as string);
        const berat = parseFloat(item.beratKg);
        const nilai = hargaSatuan * berat;
        totalNilai += nilai;

        detailInserts.push({
          jenisSampahId: js[0].id,
          beratKg: berat.toString(),
          hargaSaatItu: hargaSatuan.toString(),
          nilai: nilai.toString()
        });
      }

      const nomorStruk = `TRX-${Date.now().toString().slice(-6)}-${uuidv4().slice(0,4).toUpperCase()}`;

      // Insert Setoran Head
      const [newSetoran] = await tx.insert(setoran).values({
        nasabahId,
        petugasId,
        totalNilai: totalNilai.toString(),
        catatan,
        nomorStruk
      }).returning();

      // Insert Details
      await tx.insert(detailSetoran).values(
        detailInserts.map(d => ({ ...d, setoranId: newSetoran.id }))
      );

      // Update Saldo Nasabah
      const saldoLama = parseFloat(nasabahTarget[0].saldo as string || '0');
      const saldoBaru = saldoLama + totalNilai;
      
      await tx.update(nasabah).set({
        saldo: saldoBaru.toString()
      }).where(eq(nasabah.id, nasabahId));
    });

    res.status(201).json({ message: 'Setoran berhasil dicatat dan saldo nasabah bertambah' });

    // Kirim Notifikasi WA Setoran
    try {
      const [nasabahDb] = await db.select({ hp: users.nomorHp, nama: users.namaLengkap })
        .from(nasabah)
        .innerJoin(users, eq(nasabah.userId, users.id))
        .where(eq(nasabah.id, nasabahId))
        .limit(1);
      
      if (nasabahDb && nasabahDb.hp) {
        // Hitung total nilai for WA variable (transaction isolated so we do dirty calculation here or from DB)
        let total = 0;
        for (const item of details) {
           const js = await db.select().from(jenisSampah).where(eq(jenisSampah.id, item.jenisSampahId)).limit(1);
           if (js.length) {
              total += parseFloat(js[0].hargaPerKg as string) * parseFloat(item.beratKg);
           }
        }
        
        waService.sendMessage(nasabahDb.hp, `Terima kasih ${nasabahDb.nama}, setoran sampah Anda telah kami terima dengan estimasi nilai Rp ${total}. Saldo Anda telah diperbarui.\n\n- SiBankSampah`);
      }
    } catch(err) {
       console.error("Gagal broadcast WA saat setoran", err);
    }

  } catch (error: any) {
    res.status(500).json({ message: 'Transaksi setoran gagal', error: error.message });
  }
};
