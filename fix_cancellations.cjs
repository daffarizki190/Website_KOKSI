require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fix() {
  const client = await pool.connect();
  try {
    const res1 = await client.query(`
      UPDATE orders 
      SET status = 'Selesai', keterangan = NULL 
      WHERE status = 'Pengajuan Pembatalan';
    `);
    console.log(`✅ Diperbarui ${res1.rowCount} pesanan 'Pengajuan Pembatalan' -> 'Selesai'`);

    const res2 = await client.query(`
      UPDATE orders 
      SET status = 'Siap Diambil', keterangan = NULL 
      WHERE status = 'Dibatalkan';
    `);
    console.log(`✅ Diperbarui ${res2.rowCount} pesanan 'Dibatalkan' -> 'Siap Diambil'`);

    const statusCounts = await client.query(`
      SELECT status, COUNT(*) as count 
      FROM orders 
      GROUP BY status 
      ORDER BY count DESC;
    `);

    console.log('\n📊 Distribusi Status Pesanan Terkini di Database:');
    statusCounts.rows.forEach(r => {
      console.log(`   - ${r.status.padEnd(22)}: ${r.count} pesanan`);
    });

  } finally {
    client.release();
    await pool.end();
  }
}

fix().catch(console.error);
