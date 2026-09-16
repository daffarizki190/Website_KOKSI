import pg from 'pg';

const { Client } = pg;

async function checkProducts(dbUrl, envName) {
  const client = new Client({ connectionString: dbUrl });
  try {
    await client.connect();
    const res = await client.query('SELECT count(*) FROM products');
    console.log(`[${envName}] Jumlah produk: ${res.rows[0].count}`);
    
    if (parseInt(res.rows[0].count) > 0) {
      const sample = await client.query('SELECT nama_barang, harga FROM products LIMIT 5');
      console.table(sample.rows);
    }
  } catch (err) {
    console.error(`[${envName}] Error:`, err.message);
  } finally {
    await client.end();
  }
}

async function run() {
  await checkProducts('postgresql://postgres:postgres@localhost:5432/koksi_db', 'LOCAL');
  await checkProducts('postgresql://neondb_owner:npg_N95ArsaUnCLq@ep-shy-violet-auxahk1j-pooler.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require', 'PRODUCTION');
}

run();
