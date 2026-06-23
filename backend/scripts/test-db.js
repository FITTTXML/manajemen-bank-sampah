const postgres = require('postgres');
const sql = postgres('postgresql://postgres:LwZKkTzYDbnNdgFvMrDWdPhJzNgHkxYj@trolley.proxy.rlwy.net:55436/railway', { prepare: false, ssl: 'require' });
sql`select * from users limit 1`.then(console.log).catch(console.error).finally(() => process.exit());
