import pg from 'pg';
const { Client } = pg;

const CATEGORIES = [
  {
    name: 'Makanan & Minuman Siap Saji (F&B)',
    subs: ['Minuman Dingin & Kemasan', 'Makanan Ringan (Snacks)', 'Makanan Instan', 'Bahan Makanan (Sembako)', 'Susu & Olahan Susu']
  },
  {
    name: 'Perawatan Diri & Kesehatan (Personal Care)',
    subs: ['Perawatan Mandi & Rambut', 'Perawatan Gigi', 'Perawatan Kulit & Tubuh', 'Kebutuhan Wanita & Bayi', 'Obat-obatan Bebas (OTC) & P3K']
  },
  {
    name: 'Kebutuhan Rumah Tangga (Household)',
    subs: ['Pembersih Pakaian', 'Pembersih Rumah', 'Perlengkapan Rumah', 'Alat Kebersihan Dasar']
  },
  {
    name: 'Rokok & Produk Kasir (Impulse Items)',
    subs: ['Rokok & Aksesori', 'Permen & Cokelat Kecil', 'Aksesori & Baterai']
  },
  {
    name: 'Non-Food & Perlengkapan Umum',
    subs: ['Alat Tulis Kantor (ATK) Dasar', 'Perlengkapan Plastik & Dapur']
  }
];

function getCategoryForSub(sub) {
  for (const c of CATEGORIES) {
    if (c.subs.includes(sub)) return c.name;
  }
  return null;
}

async function fixDb() {
  const client = new Client({ connectionString: 'postgresql://neondb_owner:npg_N95ArsaUnCLq@ep-shy-violet-auxahk1j-pooler.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require' });
  try {
    await client.connect();
    
    const res = await client.query(`SELECT id, nama_barang, kategori, sub_kategori FROM products`);
    
    let updated = 0;
    
    for (const row of res.rows) {
      let finalCat = row.kategori;
      let finalSub = row.sub_kategori;
      
      const expectedCat = getCategoryForSub(finalSub);
      if (expectedCat) {
        finalCat = expectedCat;
      } else {
        if (finalCat === 'Snack' || finalCat === 'Makanan Ringan (Snacks)') {
          finalCat = 'Makanan & Minuman Siap Saji (F&B)';
          finalSub = 'Makanan Ringan (Snacks)';
        }
      }
      
      if (finalCat !== row.kategori || finalSub !== row.sub_kategori) {
        console.log(`Updating product: ${row.id} - ${row.nama_barang} to Cat: ${finalCat}, Sub: ${finalSub}`);
        await client.query('UPDATE products SET kategori = $1, sub_kategori = $2 WHERE id = $3', [finalCat, finalSub, row.id]);
        updated++;
      }
    }
    
    console.log(`Database fixed successfully! Updated ${updated} products.`);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

fixDb();
