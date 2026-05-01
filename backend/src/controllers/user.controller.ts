import { Request, Response } from 'express';
import { db } from '../db';
import { users, nasabah } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// Get All Users (Admin view)
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    // Left join with nasabah profile to get all info
    // For now we just fetch all users
    const allUsers = await db.select({
      id: users.id,
      namaLengkap: users.namaLengkap,
      email: users.email,
      role: users.role,
      status: users.status,
      nomorHp: users.nomorHp,
      createdAt: users.createdAt,
    }).from(users).orderBy(desc(users.createdAt));

    res.json({
      message: 'Daftar pengguna berhasil diambil',
      data: allUsers
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Gagal mengambil data pengguna', error: error.message });
  }
};

// Create User (Admin bypass)
export const createUser = async (req: Request, res: Response) => {
  try {
    const { namaLengkap, email, password, role, nomorHp, nik, alamat } = req.body;

    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'Email sudah terdaftar' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    // Auto-generate username from email
    const username = email.split('@')[0] + Math.floor(Math.random() * 100);

    if (role === 'nasabah') {
      if (!nik) return res.status(400).json({ message: 'NIK dibutuhkan untuk pendaftaran Nasabah' });
      
      const existingNasabah = await db.select().from(nasabah).where(eq(nasabah.nik, nik)).limit(1);
      if (existingNasabah.length > 0) {
        return res.status(400).json({ message: 'NIK sudah terdaftar' });
      }

      await db.transaction(async (tx) => {
        const [newUser] = await tx.insert(users).values({
          username, namaLengkap, email, passwordHash: hashedPassword, nomorHp, role
        }).returning();

        const year = new Date().getFullYear();
        const randomId = Math.floor(1000 + Math.random() * 9000);
        
        await tx.insert(nasabah).values({
          userId: newUser.id,
          nik,
          alamat,
          noAnggota: `BS-${year}-${randomId}`,
        });
      });
      return res.status(201).json({ message: 'Akun nasabah berhasil dibuat' });
    } else {
      // Create admin or petugas
      await db.insert(users).values({
        username, namaLengkap, email, passwordHash: hashedPassword, nomorHp, role
      });
      return res.status(201).json({ message: `Akun ${role} berhasil dibuat` });
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Gagal membuat akun', error: error.message });
  }
};

// Toggle User Status (Block/Unblock)
export const toggleUserStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // true = active, false = disabled

    await db.update(users).set({ status, updatedAt: new Date() }).where(eq(users.id, id as string));

    res.json({ message: 'Status pengguna berhasil diperbarui' });
  } catch (error: any) {
    res.status(500).json({ message: 'Gagal mengupdate status', error: error.message });
  }
};

// Update User Profile
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { namaLengkap, email, nomorHp } = req.body;

    const existingEmail = await db.select().from(users).where(eq(users.email, email));
    if (existingEmail.length > 0 && existingEmail[0].id !== userId) {
      return res.status(400).json({ message: 'Email sudah terdaftar oleh pengguna lain' });
    }

    await db.update(users).set({
      namaLengkap, email, nomorHp, updatedAt: new Date()
    }).where(eq(users.id, userId));

    res.json({ message: 'Profil berhasil diperbarui' });
  } catch (error: any) {
    res.status(500).json({ message: 'Gagal memperbarui profil', error: error.message });
  }
};

// Update Password
export const updatePassword = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { passwordLama, passwordBaru } = req.body;

    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

    const isMatch = await bcrypt.compare(passwordLama, user.passwordHash);
    if (!isMatch) return res.status(400).json({ message: 'Password lama tidak sesuai' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(passwordBaru, salt);

    await db.update(users).set({
      passwordHash: hashedPassword, updatedAt: new Date()
    }).where(eq(users.id, userId));

    res.json({ message: 'Password berhasil diubah' });
  } catch (error: any) {
    res.status(500).json({ message: 'Gagal mengubah password', error: error.message });
  }
};

