require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const INDONESIAN_NAMES = [
  'Budi Santoso', 'Siti Rahmawati', 'Agus Setiawan', 'Dewi Lestari', 'Eko Prasetyo',
  'Rina Marlina', 'Hendra Gunawan', 'Sri Wahyuni', 'Bambang Supriyanto', 'Nurul Hidayah',
  'Ahmad Fauzi', 'Ratna Sari', 'Dedi Kurniawan', 'Fitri Handayani', 'Joko Widodo',
  'Maya Anggraini', 'Rian Hidayat', 'Indah Permatasari', 'Bayu Pratama', 'Yuni Astuti',
  'Doni Firmansyah', 'Mega Utami', 'Fajar Ramadhan', 'Dian Kusuma', 'Taufik Hidayat',
  'Anita Wijaya', 'Gita Gutawa', 'Hadi Purnomo', 'Lia Safitri', 'Rizky Pratama',
  'Nita Amelia', 'Adi Nugroho', 'Tia Maharani', 'Surya Saputra', 'Desi Ratnasari',
  'Irfan Hakim', 'Wulan Guritno', 'Wahyu Hidayat', 'Kartika Putri', 'Bagus Wicaksono',
  'Citra Kirana', 'Lukman Hakim', 'Annisa Pohan', 'Gilang Dirga', 'Poppy Bunga',
  'Dimas Anggara', 'Rossa Roslaina', 'Andi Soraya', 'Reza Rahadian', 'Vina Panduwinata'
];

const DEPARTMENTS = [
  'Digital Industries',
  'Smart Infrastructure',
  'Mobility & Rail Systems',
  'Finance & Controlling',
  'Human Resources',
  'Information Technology',
  'Supply Chain & Procurement',
  'Engineering & Commissioning',
  'Quality Assurance & HSE',
  'Corporate Communications',
  'Project Management Office',
  'Customer Support & Service',
  'Research & Development',
  'Legal & Compliance',
  'Warehouse & Logistics'
];

const ORDER_STATUSES = [
  'Selesai',
  'Selesai',
  'Selesai',
  'Siap Diambil',
  'Siap Diambil',
  'Dalam Pengiriman',
  'Sedang Menyiapkan',
  'Proses',
  'Menunggu Konfirmasi'
];

async function run() {
  const client = await pool.connect();
  try {
    console.log('🚀 Memulai Simulasi 50 User dan Transaksi BelanjaIn Saza...');

    // 1. Fetch available products
    const prodRes = await client.query(`SELECT id, nama_barang, kategori, sub_kategori, harga, stok FROM products ORDER BY id ASC;`);
    const productList = prodRes.rows;
    if (productList.length === 0) {
      console.error('❌ Tidak ada produk di database.');
      return;
    }
    console.log(`📦 Ditemukan ${productList.length} produk di database.`);

    const defaultPasswordHash = await bcrypt.hash('Password123!', 10);
    const createdUsers = [];

    // 2. Generate and Insert 50 Users
    for (let i = 0; i < 50; i++) {
      const name = INDONESIAN_NAMES[i] || `Karyawan Siemens ${i + 1}`;
      const dept = DEPARTMENTS[i % DEPARTMENTS.length];
      const phone = `0812${String(10000000 + i * 137).substring(0, 8)}`;

      // Check existing user
      const uRes = await client.query(`SELECT id, nama, pt, departemen, no_hp FROM users WHERE no_hp = $1;`, [phone]);
      let userRecord;
      if (uRes.rows.length > 0) {
        userRecord = uRes.rows[0];
      } else {
        const insRes = await client.query(`
          INSERT INTO users (nama, pt, departemen, no_hp, role, password, created_at)
          VALUES ($1, $2, $3, $4, 'user', $5, NOW())
          RETURNING id, nama, pt, departemen, no_hp;
        `, [name, 'PT. Siemens Indonesia', dept, phone, defaultPasswordHash]);
        userRecord = insRes.rows[0];
      }
      createdUsers.push(userRecord);
    }
    console.log(`✅ Berhasil menyiapkan 50 user PT. Siemens Indonesia.`);

    // 3. Generate Transactions across August 2026
    let totalOrdersCreated = 0;
    let totalItemsCreated = 0;
    let totalGrossAmount = 0;
    const statusCounts = {};

    for (let u = 0; u < createdUsers.length; u++) {
      const user = createdUsers[u];
      const orderCountForUser = (u % 3 === 0) ? 2 : 1;

      for (let o = 0; o < orderCountForUser; o++) {
        const day = (u % 17) + 1;
        const hour = 8 + (u % 10);
        const minute = (u * 7) % 60;
        const dateStr = `2026-08-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;

        const status = ORDER_STATUSES[(u + o * 3) % ORDER_STATUSES.length];
        statusCounts[status] = (statusCounts[status] || 0) + 1;

        const keterangan = status === 'Pengajuan Pembatalan'
          ? 'Salah pilih ukuran/varian produk saat checkout'
          : status === 'Dibatalkan'
            ? 'Pesanan dibatalkan oleh pengguna'
            : null;

        const itemCount = 1 + ((u + o) % 3);
        const selectedItems = [];
        let orderTotal = 0;

        for (let k = 0; k < itemCount; k++) {
          const prodIdx = (u * 3 + o * 2 + k * 5) % productList.length;
          const prod = productList[prodIdx];
          const qty = 1 + ((u + k) % 4);
          const price = prod.harga;
          orderTotal += (qty * price);
          selectedItems.push({ product: prod, qty, price });
        }

        // Insert Order
        const ordRes = await client.query(`
          INSERT INTO orders (user_id, total_amount, status, keterangan, created_at)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id;
        `, [user.id, orderTotal, status, keterangan, dateStr]);

        const orderId = ordRes.rows[0].id;
        totalOrdersCreated++;
        totalGrossAmount += orderTotal;

        // Insert Order Items
        for (const it of selectedItems) {
          await client.query(`
            INSERT INTO order_items (order_id, product_id, quantity, price)
            VALUES ($1, $2, $3, $4);
          `, [orderId, it.product.id, it.qty, it.price]);
          totalItemsCreated++;
        }
      }
    }

    console.log(`\n======================================================`);
    console.log(`🎉 HASIL SIMULASI DATA TRANSAKSI BELANJAIN SAZA`);
    console.log(`======================================================`);
    console.log(`👥 Total User PT. Siemens: ${createdUsers.length} Karyawan`);
    console.log(`🛒 Total Transaksi Checkout: ${totalOrdersCreated} Pesanan`);
    console.log(`📦 Total Detail Item Barang: ${totalItemsCreated} Item`);
    console.log(`💰 Total Nilai Transaksi (Omzet): Rp ${totalGrossAmount.toLocaleString('id-ID')}`);
    console.log(`\n📊 Distribusi Status Pesanan:`);
    Object.entries(statusCounts).forEach(([st, cnt]) => {
      console.log(`   - ${st.padEnd(22)}: ${cnt} pesanan`);
    });
    console.log(`======================================================\n`);

  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => {
  console.error('❌ Error simulasi:', err);
  process.exit(1);
});
