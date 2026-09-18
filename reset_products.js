import pg from 'pg';
const { Client } = pg;

async function resetProducts() {
  const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_N95ArsaUnCLq@ep-shy-violet-auxahk1j-pooler.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require'
  });

  try {
    await client.connect();
    console.log('✅ Terkoneksi ke database.');

    // Cek jumlah produk sebelum dihapus
    const before = await client.query('SELECT COUNT(*) as total FROM products');
    console.log(`📦 Jumlah produk sebelum dihapus: ${before.rows[0].total}`);

    // Hapus semua cart_items dulu (foreign key dependency)
    await client.query('DELETE FROM cart_items');
    console.log('🗑️  Semua cart_items dihapus.');

    // Hapus semua produk
    await client.query('DELETE FROM products');
    console.log('🗑️  Semua produk dihapus dari database.');

    // Cek setelah dihapus
    const after = await client.query('SELECT COUNT(*) as total FROM products');
    console.log(`✅ Jumlah produk setelah dihapus: ${after.rows[0].total}`);

    console.log('\n🎉 Database produk berhasil dikosongkan!');
    console.log('📋 Kategori yang tersedia untuk input produk baru:');
    console.log('   1. Makanan & Minuman Siap Saji (F&B)');
    console.log('      - Minuman Dingin & Kemasan');
    console.log('      - Makanan Ringan (Snacks)');
    console.log('      - Makanan Instan');
    console.log('      - Bahan Makanan (Sembako)');
    console.log('      - Susu & Olahan Susu');
    console.log('   2. Perawatan Diri & Kesehatan (Personal Care)');
    console.log('      - Perawatan Mandi & Rambut');
    console.log('      - Perawatan Gigi');
    console.log('      - Perawatan Kulit & Tubuh');
    console.log('      - Kebutuhan Wanita & Bayi');
    console.log('      - Obat-obatan Bebas (OTC) & P3K');

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await client.end();
    console.log('🔌 Koneksi database ditutup.');
  }
}

resetProducts();
