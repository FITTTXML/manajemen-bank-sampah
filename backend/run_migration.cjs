const { Pool } = require('postgres');
// Use postgres package that's already in the project
const sql = require('postgres')('postgresql://postgres:postgres@localhost:5432/banksampah');

async function migrate() {
  try {
    await sql`CREATE TYPE "status_penjemputan" AS ENUM('menunggu', 'dijemput', 'selesai', 'ditolak')`;
    console.log('Created enum');
  } catch(e) { console.log('Enum exists:', e.message); }

  try {
    await sql`CREATE TABLE "penjemputan" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "nasabah_id" uuid NOT NULL,
      "alamat" text NOT NULL,
      "catatan" text,
      "jenis_sampah_desc" text NOT NULL,
      "estimasi_berat" varchar(50),
      "tanggal_request" timestamp DEFAULT now() NOT NULL,
      "tanggal_jemput" timestamp,
      "status" "status_penjemputan" DEFAULT 'menunggu' NOT NULL,
      "petugas_id" uuid,
      "alasan_tolak" text,
      "created_at" timestamp DEFAULT now() NOT NULL
    )`;
    console.log('Created table');
  } catch(e) { console.log('Table exists:', e.message); }

  try {
    await sql`ALTER TABLE "penjemputan" ADD CONSTRAINT "penjemputan_nasabah_id_nasabah_id_fk" FOREIGN KEY ("nasabah_id") REFERENCES "nasabah"("id") ON DELETE no action ON UPDATE no action`;
    console.log('Added FK1');
  } catch(e) { console.log('FK1 exists:', e.message); }

  try {
    await sql`ALTER TABLE "penjemputan" ADD CONSTRAINT "penjemputan_petugas_id_users_id_fk" FOREIGN KEY ("petugas_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action`;
    console.log('Added FK2');
  } catch(e) { console.log('FK2 exists:', e.message); }

  await sql.end();
  console.log('Migration done!');
}

migrate();
