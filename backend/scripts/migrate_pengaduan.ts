import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/banksampah';
const sql = postgres(connectionString);

async function main() {
  await sql`
    CREATE TABLE IF NOT EXISTS pengaduan (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id),
      subjek TEXT NOT NULL,
      pesan TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'menunggu_tanggapan',
      tanggapan TEXT,
      created_at TIMESTAMP DEFAULT now()
    );
  `;
  console.log("Pengaduan table migrated successfully.");
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
