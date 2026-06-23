import { Request, Response } from 'express';
import { db } from '../db';
import { penjemputan, nasabah, users, detailPenjemputan, jenisSampah } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { waService } from '../services/whatsapp.service';

// Nasabah: Ajukan pengambilan sampah
export const createPenjemputan = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { alamat, catatan, jenisSampahDesc, estimasiBerat, tanggalJadwal } = req.body;

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
      tanggalJadwal: tanggalJadwal ? new Date(tanggalJadwal) : null,
    }).returning();

    // Send WA notification to ALL petugas
    const petugasList = await db.select().from(users).where(eq(users.role, 'petugas'));

    const waMessage = `📦 *Permintaan Jemput Sampah Baru!*\n\n👤 Nasabah: ${nasabahProfile.user.namaLengkap}\n📍 Alamat: ${alamat}\n🗑️ Jenis Sampah: ${jenisSampahDesc}\n🗓️ Jadwal: ${tanggalJadwal ? new Date(tanggalJadwal).toLocaleString('id-ID') : 'Secepatnya'}\n⚖️ Estimasi Berat: ${estimasiBerat || 'Tidak disebutkan'}\n📝 Catatan: ${catatan || '-'}\n\nSilakan cek aplikasi untuk memproses permintaan ini.`;

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
        details: { with: { jenisSampah: true } }
      },
      orderBy: [desc(penjemputan.createdAt)],
    });

    return res.json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Petugas: Terima Permintaan Jemput
export const terimaPenjemputan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const petugasId = (req as any).user.id;

    const [updated] = await db.update(penjemputan)
      .set({
        status: 'dijemput',
        petugasId
      })
      .where(eq(penjemputan.id, id as string))
      .returning();

    // Notifikasi nasabah
    const nasabahData = await db.query.nasabah.findFirst({
      where: eq(nasabah.id, updated.nasabahId),
      with: { user: true },
    });

    if (nasabahData?.user?.nomorHp) {
      const waMessage = `🚚 *Penjemputan Diproses*\n\nHalo ${nasabahData.user.namaLengkap},\nPermintaan penjemputan sampah Anda (Alamat: ${updated.alamat}) sedang dalam perjalanan untuk dijemput oleh petugas kami.`;
      await waService.sendMessage(nasabahData.user.nomorHp, waMessage);
    }

    return res.json({ success: true, message: 'Permintaan berhasil diambil.', data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Petugas: Proses Penjemputan & Buat Tagihan
export const prosesTagihanPenjemputan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const petugasId = (req as any).user.id;
    const { details } = req.body; // Array of { jenisSampahId, beratKg }

    if (!details || !Array.isArray(details) || details.length === 0) {
      return res.status(400).json({ success: false, message: 'Detail sampah tidak valid.' });
    }

    // Hitung total tagihan
    let totalBiaya = 0;
    const insertDetails = [];

    for (const item of details) {
      const jenis = await db.query.jenisSampah.findFirst({ where: eq(jenisSampah.id, item.jenisSampahId) });
      if (!jenis) continue;

      const hargaSaatItu = Number(jenis.hargaPerKg);
      const nilai = hargaSaatItu * Number(item.beratKg);
      totalBiaya += nilai;

      insertDetails.push({
        penjemputanId: id as string,
        jenisSampahId: jenis.id,
        beratKg: String(item.beratKg),
        hargaSaatItu: String(hargaSaatItu),
        nilai: String(nilai),
      });
    }

    // Update penjemputan status and add total biaya
    const [updated] = await db.update(penjemputan)
      .set({
        tanggalJemput: new Date(),
        totalBiaya: String(totalBiaya),
        statusPembayaran: 'belum_dibayar'
      })
      .where(eq(penjemputan.id, id as string))
      .returning();

    // Insert details
    if (insertDetails.length > 0) {
      await db.insert(detailPenjemputan).values(insertDetails);
    }

    // Notify nasabah
    const nasabahData = await db.query.nasabah.findFirst({
      where: eq(nasabah.id, updated.nasabahId),
      with: { user: true },
    });

    if (nasabahData?.user?.nomorHp) {
      const waMessage = `🧾 *Tagihan Layanan Penjemputan*\n\nHalo ${nasabahData.user.namaLengkap},\nSampah Anda telah ditimbang oleh petugas.\n\n💰 *Total Biaya: Rp ${totalBiaya.toLocaleString('id-ID')}*\n\nSilakan pilih metode pembayaran (COD / Transfer) melalui aplikasi.`;
      await waService.sendMessage(nasabahData.user.nomorHp, waMessage);
    }

    return res.json({ success: true, message: 'Tagihan berhasil dibuat.', data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Nasabah: Pilih Metode Pembayaran (Upload Transfer / COD)
export const pembayaranTransfer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { metodePembayaran } = req.body;

    if (metodePembayaran === 'cod') {
      const [updated] = await db.update(penjemputan)
        .set({ metodePembayaran: 'cod' })
        .where(eq(penjemputan.id, id as string))
        .returning();
      return res.json({ success: true, message: 'Metode COD berhasil dipilih. Silakan siapkan uang tunai untuk petugas.', data: updated });
    }

    // Transfer: expect file upload via multer
    const file = (req as any).file;
    if (!file) {
      return res.status(400).json({ success: false, message: 'Screenshot bukti transfer wajib diupload.' });
    }

    const buktiUrl = `/uploads/${file.filename}`;

    const [updated] = await db.update(penjemputan)
      .set({
        metodePembayaran: 'transfer',
        buktiPembayaran: buktiUrl,
        statusPembayaran: 'menunggu_konfirmasi'
      })
      .where(eq(penjemputan.id, id as string))
      .returning();

    return res.json({ success: true, message: 'Bukti transfer berhasil diupload, menunggu konfirmasi petugas.', data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Petugas/Admin: Verifikasi Pembayaran & Selesaikan Transaksi
export const verifikasiPembayaran = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { metodePembayaran } = req.body; // optional, but if COD they pass 'cod'

    const updateData: any = {
      status: 'selesai',
      statusPembayaran: 'lunas'
    };

    if (metodePembayaran === 'cod') {
      updateData.metodePembayaran = 'cod';
    }

    const [updated] = await db.update(penjemputan)
      .set(updateData)
      .where(eq(penjemputan.id, id as string))
      .returning();

    // Notify nasabah
    const nasabahData = await db.query.nasabah.findFirst({
      where: eq(nasabah.id, updated.nasabahId),
      with: { user: true },
    });

    if (nasabahData?.user?.nomorHp) {
      const waMessage = `✅ *Pembayaran Lunas*\n\nTerima kasih, pembayaran untuk layanan penjemputan sampah Anda telah kami terima. Layanan selesai.`;
      await waService.sendMessage(nasabahData.user.nomorHp, waMessage);
    }

    return res.json({ success: true, message: 'Pembayaran berhasil diverifikasi dan transaksi selesai.', data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
