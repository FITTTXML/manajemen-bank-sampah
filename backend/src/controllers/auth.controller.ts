import { Request, Response } from 'express';
import { db } from '../db';
import { users, nasabah } from '../db/schema';
import { eq, or } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const generateToken = (id: string, role: string) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'supersecretkey_sibanksampah2026', {
    expiresIn: '1d',
  });
};

export const registerNasabah = async (req: Request, res: Response) => {
  try {
    const { namaLengkap, email, password, nomorHp, alamat } = req.body;

    // Check if email already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'Email sudah terdaftar' });
    }



    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Drizzle ORM does not support native nested inserts across independent tables yet without transaction block directly
    const result = await db.transaction(async (tx) => {
      // Generate username (e.g., from email prefix or name)
      const generatedUsername = email.split('@')[0] + Math.floor(Math.random() * 1000);

      // 1. Create User
      const [newUser] = await tx.insert(users).values({
        username: generatedUsername,
        namaLengkap,
        email,
        passwordHash: hashedPassword,
        nomorHp,
        role: 'nasabah'
      }).returning();

      // Generate Auto No Anggota (e.g. BS-2026-XXXX)
      const year = new Date().getFullYear();
      const randomId = Math.floor(1000 + Math.random() * 9000);
      const noAnggota = `BS-${year}-${randomId}`;

      // 2. Create Nasabah Profile
      const [newNasabah] = await tx.insert(nasabah).values({
        userId: newUser.id,
        alamat,
        noAnggota,
      }).returning();

      return { user: newUser, nasabah: newNasabah };
    });

    res.status(201).json({
      message: 'Registrasi berhasil',
      data: {
        id: result.user.id,
        nama: result.user.namaLengkap,
        noAnggota: result.nasabah.noAnggota
      }
    });

  } catch (error: any) {
    res.status(500).json({ message: 'Gagal melakukan registrasi', error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // 1. Find user by email or username
    const identifier = email; // we keep calling it email from frontend to avoid breaking changes, but it can be either
    const usersList = await db.select().from(users).where(
      or(eq(users.email, identifier), eq(users.username, identifier))
    ).limit(1);
    const user = usersList[0];

    if (!user) {
      return res.status(401).json({ message: 'Kredensial tidak valid' });
    }

    // 2. Compare password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Kredensial tidak valid' });
    }

    // 3. User must be active
    if (!user.status) {
      return res.status(403).json({ message: 'Akun Anda dinonaktifkan, silakan hubungi admin' });
    }

    // 4. Update last login
    await db.update(users).set({ lastLogin: new Date() }).where(eq(users.id, user.id));

    // 5. Generate token
    const token = generateToken(user.id, user.role);

    res.json({
      message: 'Login berhasil',
      token,
      user: {
        id: user.id,
        namaLengkap: user.namaLengkap,
        email: user.email,
        role: user.role,
        fotoProfil: user.fotoProfil
      }
    });

  } catch (error: any) {
    res.status(500).json({ message: 'Terjadi kesalahan saat login', error: error.message });
  }
};

// In-memory store for reset codes (production: use Redis)
const resetCodes = new Map<string, { code: string; expiresAt: number; userId: string }>();

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email / username harus diisi.' });
    }

    // Find user
    const usersList = await db.select().from(users).where(
      or(eq(users.email, email), eq(users.username, email))
    ).limit(1);
    const user = usersList[0];

    if (!user) {
      return res.status(404).json({ success: false, message: 'Akun dengan email/username tersebut tidak ditemukan.' });
    }

    if (!user.nomorHp) {
      return res.status(400).json({ success: false, message: 'Nomor HP belum terdaftar di akun ini. Hubungi admin untuk mereset password.' });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    resetCodes.set(email, { code, expiresAt, userId: user.id });

    // Send via WhatsApp
    const { waService } = require('../services/whatsapp.service');
    const waMessage = `🔐 *Reset Password SiBankSampah*\n\nHalo ${user.namaLengkap},\n\nKode OTP Anda: *${code}*\n\nKode ini berlaku selama 10 menit.\n⚠️ Jangan berikan kode ini kepada siapa pun.`;

    const sent = await waService.sendMessage(user.nomorHp, waMessage);

    if (!sent) {
      return res.status(500).json({ success: false, message: 'Gagal mengirim kode OTP. Bot WhatsApp belum terhubung.' });
    }

    // Mask phone number for response
    const maskedHp = user.nomorHp.replace(/(\d{4})\d+(\d{3})/, '$1****$2');

    return res.json({
      success: true,
      message: `Kode OTP telah dikirim ke WhatsApp ${maskedHp}`,
      maskedHp,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, kode OTP, dan password baru harus diisi.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password baru minimal 6 karakter.' });
    }

    const stored = resetCodes.get(email);
    if (!stored) {
      return res.status(400).json({ success: false, message: 'Kode OTP tidak ditemukan. Silakan minta ulang.' });
    }

    if (Date.now() > stored.expiresAt) {
      resetCodes.delete(email);
      return res.status(400).json({ success: false, message: 'Kode OTP sudah kadaluarsa. Silakan minta ulang.' });
    }

    if (stored.code !== code) {
      return res.status(400).json({ success: false, message: 'Kode OTP salah.' });
    }

    // Update password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await db.update(users).set({ passwordHash: hashedPassword }).where(eq(users.id, stored.userId));

    // Cleanup
    resetCodes.delete(email);

    return res.json({ success: true, message: 'Password berhasil diubah! Silakan login dengan password baru.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
