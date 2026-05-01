import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/banksampah';
const sql = postgres(connectionString);

async function wipe() {
  console.log('Wiping database schema for clean sync...');
  await sql`DROP SCHEMA public CASCADE`;
  await sql`CREATE SCHEMA public`;
  await sql`GRANT ALL ON SCHEMA public TO postgres`;
  await sql`GRANT ALL ON SCHEMA public TO public`;
  console.log('Database wiped successfully.');
  process.exit(0);
}

wipe().catch((err) => {
  console.error(err);
  process.exit(1);
});
