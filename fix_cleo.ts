import { Client } from 'pg';
async function fixManual() {
  const client = new Client({ connectionString: 'postgresql://neondb_owner:npg_N95ArsaUnCLq@ep-shy-violet-auxahk1j-pooler.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require' });
  await client.connect();
  
  const updates = [
    { nama: 'FreshCare Aromatherapy Roll On Strong 10 ml', cat: 'Perawatan Diri & Kesehatan (Personal Care)', sub: 'Obat-obatan Bebas (OTC) & P3K' },
    { nama: 'FreshCare Aromatherapy Roll On Citrus 10 ml', cat: 'Perawatan Diri & Kesehatan (Personal Care)', sub: 'Obat-obatan Bebas (OTC) & P3K' },
    { nama: 'Lay\'s / Chitaato Lite Rumput Laut 68 g', cat: 'Makanan & Minuman Siap Saji (F&B)', sub: 'Makanan Ringan (Snacks)' },
    { nama: 'Komix Herbal Lemon 6s x 15 ml', cat: 'Perawatan Diri & Kesehatan (Personal Care)', sub: 'Obat-obatan Bebas (OTC) & P3K' },
    { nama: 'Dermafix T Pad Steril Waterproof 5 cm x 7 cm 1s', cat: 'Perawatan Diri & Kesehatan (Personal Care)', sub: 'Obat-obatan Bebas (OTC) & P3K' },
    { nama: 'Gillette Mach 3 Turbo Razor Pisau Cukur 1s', cat: 'Perawatan Diri & Kesehatan (Personal Care)', sub: 'Perawatan Mandi & Rambut' },
    { nama: 'Gillette Blue II Plus Disposable Razor 2s', cat: 'Perawatan Diri & Kesehatan (Personal Care)', sub: 'Perawatan Mandi & Rambut' },
    { nama: 'Nescafé Original 220 ml', cat: 'Makanan & Minuman Siap Saji (F&B)', sub: 'Minuman Dingin & Kemasan' },
    { nama: 'Frestea Apple 350 ml', cat: 'Makanan & Minuman Siap Saji (F&B)', sub: 'Minuman Dingin & Kemasan' },
    { nama: 'Frestea Jasmine 350 ml', cat: 'Makanan & Minuman Siap Saji (F&B)', sub: 'Minuman Dingin & Kemasan' },
    { nama: 'Isoplus 350 ml', cat: 'Makanan & Minuman Siap Saji (F&B)', sub: 'Minuman Dingin & Kemasan' },
    { nama: 'Country Choice Orange 250 ml', cat: 'Makanan & Minuman Siap Saji (F&B)', sub: 'Minuman Dingin & Kemasan' },
    { nama: 'Super Bubur Rasa Sapi 45 g', cat: 'Makanan & Minuman Siap Saji (F&B)', sub: 'Makanan Instan' },
    { nama: 'Super Bubur Rasa Ayam 45 g', cat: 'Makanan & Minuman Siap Saji (F&B)', sub: 'Makanan Instan' },
    { nama: 'Super Bubur Cup Rasa Ayam 49 g', cat: 'Makanan & Minuman Siap Saji (F&B)', sub: 'Makanan Instan' },
    { nama: 'RAMOS BANDUNG 5 KG', cat: 'Makanan & Minuman Siap Saji (F&B)', sub: 'Bahan Makanan (Sembako)' },
    { nama: 'PANDAN WANGI CAP PANDA 10 KG', cat: 'Makanan & Minuman Siap Saji (F&B)', sub: 'Bahan Makanan (Sembako)' },
    { nama: 'PANDAN WANGI "BMW" CIANJUR 5 KG', cat: 'Makanan & Minuman Siap Saji (F&B)', sub: 'Bahan Makanan (Sembako)' },
    { nama: 'CAP "IKAN LELE SUPER" 5 KG', cat: 'Makanan & Minuman Siap Saji (F&B)', sub: 'Bahan Makanan (Sembako)' },
    { nama: 'Morinaga Chil Kid Gold Vanilla 800 g', cat: 'Perawatan Diri & Kesehatan (Personal Care)', sub: 'Kebutuhan Wanita & Bayi' },
    { nama: 'SUSU ZEE', cat: 'Makanan & Minuman Siap Saji (F&B)', sub: 'Susu & Olahan Susu' },
    { nama: 'Posh Men Renceng 12\'s', cat: 'Perawatan Diri & Kesehatan (Personal Care)', sub: 'Perawatan Kulit & Tubuh' },
    { nama: 'Posh Hijab / Wanita 12\'s', cat: 'Perawatan Diri & Kesehatan (Personal Care)', sub: 'Perawatan Kulit & Tubuh' },
    { nama: 'Whisper Skin Love Day Wing 24 cm 18s', cat: 'Perawatan Diri & Kesehatan (Personal Care)', sub: 'Kebutuhan Wanita & Bayi' },
    { nama: 'Baby Happy Pants L 30s', cat: 'Perawatan Diri & Kesehatan (Personal Care)', sub: 'Kebutuhan Wanita & Bayi' },
    { nama: 'Doodle Exclusive Telon Oil 100 ml', cat: 'Perawatan Diri & Kesehatan (Personal Care)', sub: 'Kebutuhan Wanita & Bayi' },
    { nama: 'Safe Care Aromatherapy Roll On 10 ml', cat: 'Perawatan Diri & Kesehatan (Personal Care)', sub: 'Obat-obatan Bebas (OTC) & P3K' },
    { nama: 'Froggy / Yupi Gummy Bears 45 g', cat: 'Rokok & Produk Kasir (Impulse Items)', sub: 'Permen & Cokelat Kecil' },
  ];
  
  for (const u of updates) {
    await client.query('UPDATE products SET kategori = $1, sub_kategori = $2 WHERE nama_barang = $3', [u.cat, u.sub, u.nama]);
    console.log(`Updated: ${u.nama}`);
  }
  await client.end();
}
fixManual();
