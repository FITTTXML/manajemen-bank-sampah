const postgres = require('postgres');
const sql = postgres('postgresql://postgres:GnpWLhLADPnwLqLCAAPQnwzQLSvEgtIE@acela.proxy.rlwy.net:58897/railway', { prepare: false, ssl: 'require' });

async function reset() {
  await sql`DROP SCHEMA public CASCADE`;
  await sql`CREATE SCHEMA public`;
  console.log('Database schema reset successful');
  process.exit();
}

reset().catch(err => {
  console.error(err);
  process.exit(1);
});
