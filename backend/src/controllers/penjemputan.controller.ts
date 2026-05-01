import { Request, Response } from 'express';
import { db } from '../db';
import { penjemputan, nasabah, users } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { waService } from '../services/whatsapp.service';

// Nasabah: Ajukan pengambilan sampah
export const createPenjemputan = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { alamat, catatan, jenisSampahDesc, estimasiBerat } = req.body;

    if (!alamat || !jenisSampahDesc) {
      return res.status(400).json({ success: false, message: 'Alamat dan jenis sampah harus diisi.' });
    }

    // Get nasabah profile
    const nasabahProfile = await db.query.nasabah.findFirst({
      where: eq(nasabah.userId, userId),
      with: { user: true }
    });

    if (!nasabahProfile) {
      return res.status(404).json({ success: false, message: 'Profil nasabah tidak ditemukan.' });
    }

    // Create pickup request
    const [newRequest] = await db.insert(penjemputan).values({
      nasabahId: nasabahProfile.id,
      alamat,
      catatan: catatan || null,
      jenisSampahDesc,
      estimasiBerat: estimasiBerat || null,
    }).returning();

    // Send WA notification to ALL petugas
    const petugasList = await db.select().from(users).where(eq(users.role, 'petugas'));

    const waMessage = `📦 *Permintaan Jemput Sampah Baru!*\n\n👤 Nasabah: ${nasabahProfile.user.namaLengkap}\n📍 Alamat: ${alamat}\n🗑️ Jenis Sampah: ${jenisSampahDesc}\n⚖️ Estimasi Berat: ${estimasiBerat || 'Tidak disebutkan'}\n📝 Catatan: ${catatan || '-'}\n\nSilakan cek aplikasi untuk memproses permintaan ini.`;

    for (const petugas of petugasList) {
      if (petugas.nomorHp) {
        await waService.sendMessage(petugas.nomorHp, waMessage);
      }
    }

    // Also notify admin
    const adminList = await db.select().from(users).where(eq(users.role, 'admin'));
    for (const admin of adminList) {
      if (admin.nomorHp) {
        await waService.sendMessage(admin.nomorHp, waMessage);
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Pengajuan jemput sampah berhasil! Petugas akan segera menghubungi Anda.',
      data: newRequest
    });
  } catch (error: any) {
    console.error('[Penjemputan] Create error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Gagal mengajukan jemput sampah.' });
  }
};

// Nasabah: Lihat riwayat request sendiri
export const getMyPenjemputan = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const nasabahProfile = await db.query.nasabah.findFirst({
      where: eq(nasabah.userId, userId),
    });

    if (!nasabahProfile) {
      return res.status(404).json({ success: false, message: 'Profil nasabah tidak ditemukan.' });
    }

    const data = await db.select().from(penjemputan)
      .where(eq(penjemputan.nasabahId, nasabahProfile.id))
      .orderBy(desc(penjemputan.createdAt));

    return res.json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Petugas/Admin: Lihat semua request
export const getAllPenjemputan = async (req: Request, res: Response) => {
  try {
    const data = await db.query.penjemputan.findMany({
      with: {
        nasabahRef: { with: { user: true } },
        petugasRef: true,
      },
      orderBy: [desc(penjemputan.createdAt)],
    });

    return res.json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Petugas: Update status penjemputan
export const updateStatusPenjemputan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const petugasId = (req as any).user.id;
    const { status, alasanTolak } = req.body;

    const [updated] = await db.update(penjemputan)
      .set({
        status,
        petugasId,
        alasanTolak: status === 'ditolak' ? alasanTolak : null,
        tanggalJemput: status === 'dijemput' ? new Date() : undefined,
      })
      .where(eq(penjemputan.id, id))
      .returning();

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Data penjemputan tidak ditemukan.' });
    }

    // Notify nasabah via WA
    const nasabahData = await db.query.nasabah.findFirst({
      where: eq(nasabah.id, updated.nasabahId),
      with: { user: true },
    });

    if (nasabahData?.user?.nomorHp) {
      const statusText = status === 'dijemput' ? '🚛 Petugas sedang menuju lokasi Anda!' :
                         status === 'selesai' ? '✅ Pengambilan sampah Anda telah selesai!' :
                         status === 'ditolak' ? `❌ Mohon maaf, permintaan ditolak. Alasan: ${alasanTolak || '-'}` : '';

      if (statusText) {
        await waService.sendMessage(nasabahData.user.nomorHp, `*Update Jemput Sampah*\n\n${statusText}`);
      }
    }

    return res.json({ success: true, message: 'Status berhasil diperbarui.', data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
