import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config();

const baseDbStr = 'postgresql://postgres:postgres@localhost:5432/postgres';

async function main() {
  console.log('Menghubungkan ke server PostgreSQL lokal...');
  const sqlBase = postgres(baseDbStr);

  try {
    // Drop database if exists (to wipe everything out completely)
    console.log('Menghapus database banksampah jika sudah ada...');
    await sqlBase`DROP DATABASE IF EXISTS banksampah`;

    // Create fresh database
    console.log('Membuat ulang database banksampah...');
    await sqlBase`CREATE DATABASE banksampah`;
    console.log('Pembuatan database selesai.');
  } catch (error) {
    console.error('Gagal membuat database:', error);
    process.exit(1);
  } finally {
    await sqlBase.end();
  }
}

main().then(() => {
  console.log('OK');
  process.exit(0);
});
