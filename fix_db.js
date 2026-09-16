import pg from 'pg';
const { Client } = pg;

async function fixDb() {
  const client = new Client({ connectionString: 'postgresql://neondb_owner:npg_N95ArsaUnCLq@ep-shy-violet-auxahk1j-pooler.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require' });
  try {
    await client.connect();
    
    const res = await client.query(`SELECT id, nama_barang, kategori, sub_kategori FROM products WHERE id >= 342 ORDER BY id ASC`);
    
    let currentSub = '';
    let currentCat = '';
    
    for (const row of res.rows) {
      if (row.sub_kategori === 'No') {
        // This is a header row, we should delete it eventually, but first let's extract the sub category
        currentSub = row.nama_barang.replace('Kategori ', '').trim();
        
        // Determine main category
        if (['Pembersih Pakaian', 'Pembersih Rumah', 'Perlengkapan Rumah', 'Alat Kebersihan Dasar', 'Perlengkapan Plastik & Dapur'].includes(currentSub)) {
          currentCat = 'Kebutuhan Rumah Tangga (Household)';
        } else if (currentSub === 'Rokok & Aksesori') {
          currentCat = 'Rokok & Produk Kasir (Impulse Items)';
        } else if (currentSub === 'Permen & Cokelat Kecil') {
          currentCat = 'Snack';
        } else if (['Aksesori & Baterai', 'Alat Tulis Kantor (ATK) Dasar'].includes(currentSub)) {
          currentCat = 'Non-Food & Perlengkapan Umum';
        } else {
          currentCat = 'Lainnya'; // Fallback
        }
        
        console.log(`Deleting header row: ${row.id} - ${row.nama_barang}`);
        await client.query('DELETE FROM products WHERE id = $1', [row.id]);
        
      } else {
        // This is an actual product, update its category and sub_category
        console.log(`Updating product: ${row.id} - ${row.nama_barang} to Cat: ${currentCat}, Sub: ${currentSub}`);
        await client.query('UPDATE products SET kategori = $1, sub_kategori = $2 WHERE id = $3', [currentCat, currentSub, row.id]);
      }
    }
    
    console.log("Database fixed successfully!");
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

fixDb();
