import { Request, Response } from 'express';
import { db } from '../db';
import { jenisSampah, riwayatHargaSampah } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

export const getAllJenisSampah = async (req: Request, res: Response) => {
  try {
    const list = await db.select().from(jenisSampah).orderBy(desc(jenisSampah.createdAt));
    res.json({ message: 'Berhasil mengambil data', data: list });
  } catch (error: any) {
    res.status(500).json({ message: 'Gagal mengambil data', error: error.message });
  }
};

export const createJenisSampah = async (req: Request, res: Response) => {
  try {
    const { nama, kategori, hargaPerKg, satuan, deskripsi, fotoUrl } = req.body;
    
    const [newItem] = await db.insert(jenisSampah).values({
      nama,
      kategori,
      hargaPerKg,
      satuan: satuan || 'kg',
      deskripsi,
      fotoUrl,
    }).returning();

    // Log the initial price history
    await db.insert(riwayatHargaSampah).values({
      jenisSampahId: newItem.id,
      hargaLama: '0',
      hargaBaru: hargaPerKg,
      diubahOleh: (req as any).user?.id
    });

    res.status(201).json({ message: 'Katalog jenis sampah berhasil ditambahkan', data: newItem });
  } catch (error: any) {
    res.status(500).json({ message: 'Gagal menambahkan jenis sampah', error: error.message });
  }
};

export const updateJenisSampah = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nama, kategori, hargaPerKg, satuan, deskripsi, aktif } = req.body;

    const existing = await db.select().from(jenisSampah).where(eq(jenisSampah.id, id as string)).limit(1);
    if (!existing.length) return res.status(404).json({ message: 'Data tidak ditemukan' });

    await db.transaction(async (tx) => {
      if (hargaPerKg && hargaPerKg !== parseFloat(existing[0].hargaPerKg as string)) {
        await tx.insert(riwayatHargaSampah).values({
          jenisSampahId: id as string,
          hargaLama: existing[0].hargaPerKg,
          hargaBaru: hargaPerKg,
          diubahOleh: (req as any).user?.id
        });
      }

      const payload: any = { updatedAt: new Date() };
      if (nama !== undefined) payload.nama = nama;
      if (kategori !== undefined) payload.kategori = kategori;
      if (hargaPerKg !== undefined) payload.hargaPerKg = hargaPerKg;
      if (satuan !== undefined) payload.satuan = satuan;
      if (deskripsi !== undefined) payload.deskripsi = deskripsi;
      if (aktif !== undefined) payload.aktif = aktif;

      await tx.update(jenisSampah).set(payload).where(eq(jenisSampah.id, id as string));
    });

    res.json({ message: 'Katalog berhasil diperbarui' });
  } catch (error: any) {
    console.error("UPDATE JENIS SAMPAH ERROR:", error);
    res.status(500).json({ message: 'Gagal memperbarui data', error: error.message });
  }
};

export const deleteJenisSampah = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await db.update(jenisSampah).set({ aktif: false }).where(eq(jenisSampah.id, id as string));
    res.json({ message: 'Kategori berhasil dinonaktifkan' });
  } catch (error: any) {
    res.status(500).json({ message: 'Gagal menghapus kategori', error: error.message });
  }
};
