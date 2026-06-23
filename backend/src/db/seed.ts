import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/banksampah';
const client = postgres(connectionString, { prepare: false });
const db = drizzle(client, { schema });

async function main() {
  console.log('Seeding database...');
  const salt = await bcrypt.genSalt(10);
  
  // 1. Setup Admin Default
  const adminPassword = await bcrypt.hash('admin123', salt);
  console.log('Creating Admin...');
  await db.insert(schema.users).values({
    username: 'admin',
    email: 'admin@banksampah.com',
    namaLengkap: 'Administrator Utama',
    passwordHash: adminPassword,
    role: 'admin',
    nomorHp: '0811111111',
  }).onConflictDoNothing();

  // 2. Setup User Nasabah Default
  const userPassword = await bcrypt.hash('user123', salt);
  console.log('Creating Nasabah User...');
  const [createdUser] = await db.insert(schema.users).values({
    username: 'user',
    email: 'user@banksampah.com',
    namaLengkap: 'Nasabah Teladan',
    passwordHash: userPassword,
    role: 'nasabah',
    nomorHp: '0822222222',
  }).onConflictDoNothing().returning();

  if (createdUser) {
    await db.insert(schema.nasabah).values({
      userId: createdUser.id,
      noAnggota: 'BS-2026-0001',
      nik: '3201010101010101',
      alamat: 'Jl. Merdeka No. 1, Jakarta',
    }).onConflictDoNothing();
  }

  // 3. Setup User Petugas Default
  const petugasPassword = await bcrypt.hash('petugas123', salt);
  console.log('Creating Petugas User...');
  await db.insert(schema.users).values({
    username: 'petugas',
    email: 'petugas@banksampah.com',
    namaLengkap: 'Petugas Cekatan',
    passwordHash: petugasPassword,
    role: 'petugas',
    nomorHp: '0833333333',
  }).onConflictDoNothing();

  console.log('Creating Jenis Sampah...');
  await db.insert(schema.jenisSampah).values([
    {
      nama: 'Botol Plastik Bekas',
      kategori: 'plastik',
      hargaPerKg: '2500.00',
      satuan: 'kg',
      deskripsi: 'Botol air mineral, botol minuman, dll',
    },
    {
      nama: 'Kardus Bekas',
      kategori: 'kertas',
      hargaPerKg: '1500.00',
      satuan: 'kg',
      deskripsi: 'Kardus mie, kardus paket, dll',
    },
    {
      nama: 'Besi Tua / Logam',
      kategori: 'logam',
      hargaPerKg: '4500.00',
      satuan: 'kg',
      deskripsi: 'Pipa besi, kaleng, seng',
    }
  ]).onConflictDoNothing();

  console.log('Database Seeding Completed!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
