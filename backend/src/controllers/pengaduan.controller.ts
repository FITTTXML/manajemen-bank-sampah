import { Request, Response } from 'express';
import { db } from '../db';
import { pengaduan, users } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { waService } from '../services/whatsapp.service';

// Nasabah / Petugas membuat pengaduan
export const createPengaduan = async (req: Request, res: Response) => {
  try {
    const { subjek, pesan } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const newPengaduan = await db.insert(pengaduan).values({
      userId,
      subjek,
      pesan,
      status: 'menunggu_tanggapan'
    }).returning();

    return res.status(201).json({
      success: true,
      message: 'Pengaduan berhasil dikirim ke Admin.',
      data: newPengaduan[0]
    });
  } catch (error: any) {
    console.error('Error creating pengaduan:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengirim pengaduan.' });
  }
};

// Nasabah / Petugas melihat riwayat pengaduan mereka sendiri
export const getMyPengaduan = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const riwayat = await db.select()
      .from(pengaduan)
      .where(eq(pengaduan.userId, userId))
      .orderBy(desc(pengaduan.createdAt));

    return res.json({ success: true, data: riwayat });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Gagal mengambil data pengaduan.' });
  }
};

// Admin melihat semua pengaduan
export const getAllPengaduan = async (req: Request, res: Response) => {
  try {
    // Join dengan tabel users untuk tahu siapa yang komplain
    const semuaPengaduan = await db.select({
      id: pengaduan.id,
      subjek: pengaduan.subjek,
      pesan: pengaduan.pesan,
      status: pengaduan.status,
      tanggapan: pengaduan.tanggapan,
      createdAt: pengaduan.createdAt,
      pengirimId: users.id,
      pengirimNama: users.namaLengkap,
      pengirimRole: users.role,
      pengirimHp: users.nomorHp
    })
    .from(pengaduan)
    .innerJoin(users, eq(pengaduan.userId, users.id))
    .orderBy(desc(pengaduan.createdAt));

    return res.json({ success: true, data: semuaPengaduan });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Gagal mengambil data pengaduan.' });
  }
};

// Admin membalas pengaduan
export const balasPengaduan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tanggapan, kirimWa } = req.body; // kirimWa is boolean

    const updated = await db.update(pengaduan)
      .set({ 
        tanggapan, 
        status: 'selesai' 
      })
      .where(eq(pengaduan.id, id))
      .returning();

    if (updated.length === 0) {
      return res.status(404).json({ success: false, message: 'Pengaduan tidak ditemukan.' });
    }

    // Opsi integrasi WA dengan Baileys:
    if (kirimWa) {
      // Cari nomor HP pengirim
      const complainData = await db.select({ hp: users.nomorHp, nama: users.namaLengkap })
        .from(pengaduan)
        .innerJoin(users, eq(pengaduan.userId, users.id))
        .where(eq(pengaduan.id, id))
        .limit(1);
      
      const noHp = complainData[0]?.hp;
      if (noHp) {
        const textWa = `Halo ${complainData[0].nama}, tanggapan untuk keluhan Anda mengenai "${updated[0].subjek}":\n\n${tanggapan}\n\nSalam,\nAdmin SiBankSampah.`;
        // Execute WA Send asynchronously
        waService.sendMessage(noHp, textWa);
      }
    }

    return res.json({ success: true, message: 'Tanggapan berhasil disimpan.', data: updated[0] });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Gagal menanggapi pengaduan.' });
  }
};
