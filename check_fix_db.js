import pg from 'pg';
const { Client } = pg;

async function checkAndFix() {
  const client = new Client({ connectionString: 'postgresql://neondb_owner:npg_N95ArsaUnCLq@ep-shy-violet-auxahk1j-pooler.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require' });
  try {
    await client.connect();
    console.log("Connected to DB.");

    // Check current problematic items
    const res = await client.query(`SELECT id, nama_barang, kategori, sub_kategori FROM products WHERE kategori = 'Makanan & Minuman Siap Saji (F&B)'`);
    console.log("Current Data:");
    console.table(res.rows);

    // If there are still numbers, we should probably fix them manually or via a script.
    // However, I don't know the exact mapping they want for ALL of them unless I see them.
    // Let's just output them first so I can see if it's fixed.
    
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

checkAndFix();
