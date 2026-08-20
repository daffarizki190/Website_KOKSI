# 🛒 BelanjaIn SAZA (KOKSI) - E-Commerce & Koperasi Karyawan

Platform Web & Progressive Web Application (PWA) modern untuk pemesanan kebutuhan sembako dan logistik koperasi karyawan dengan multi-role access (Karyawan/User, Pengelola/Admin, IT Operations HUD), pemindai barcode, integrasi WhatsApp OTP, dan Bot Notifikasi & Controller Telegram.

---

## 🚀 Fitur Unggulan

### 1. 🛍️ Portal Karyawan (User)
- **Katalog Produk Dinamis**: Pencarian real-time, filter kategori (Makanan Siap Saji, Bahan Pokok/Sembako, Minuman, Kebersihan, dll).
- **Multi-Device Cart Storage**: Keranjang belanja tersinkronisasi otomatis via database PostgreSQL dan local device backup.
- **Jadwal Operasional Pemesanan**: Pembatasan otomatis hari operasional (Senin & Selasa) dengan override Mode Demo untuk pengujian.
- **Barcode & QR Scanner**: Pindai barcode barang menggunakan kamera HP untuk menambah produk ke keranjang secara instan.
- **Riwayat Pesanan & Bukti Transaksi**: Cek status pesanan (*Proses, Sedang Menyiapkan, Selesai, Dibatalkan*), struk belanja, dan pembatalan mandiri.

### 2. 📊 Admin Portal
- **Dashboard Metrik Penjualan**: Grafik tren omset, transaksi, dan total produk terjual dengan filter waktu (Hari ini, 7 hari, 30 hari, 1 tahun).
- **Manajemen Transaksi Real-time**: Filter pesanan berdasarkan PT (PT. Siemens Indonesia, Siemens Energy, dll), tanggal, dan status. Update status pesanan sekali klik.
- **Manajemen Katalog Produk**: Tambah produk baru, edit nama/kategori/harga/stok, serta penghapusan produk dengan modal konfirmasi aman.
- **Manajemen Pengguna / Karyawan**: Kelola data karyawan, switch role (*user, admin, it*), edit data diri, dan reset password.
- **Ekspor Laporan Excel**: Unduh rekapitulasi data penjualan ke format `.xlsx` rapi.
- **Tampilan Mobile Adaptif (Zero-Swipe)**: Tampilan otomatis beralih menjadi format *Mobile Cards* di HP sehingga tidak ada geser/scroll horizontal.

### 3. 🖥️ IT NOC & Mission Control Dashboard
- **HUD Telemetri Real-time**: Monitoring latensi database PostgreSQL, alokasi memori heap Node.js, status SSL HTTPS, dan log error otomatis.
- **Pengujian API Otomatis (6 Poin)**: Tes kesehatan endpoint Auth, Database SQL, Products, Cart Engine, Orders Engine, dan Scanner.
- **Manajemen Akun & Role IT**: Akses level tinggi untuk audit keamanan dan reset parameter sistem.
- **WhatsApp & SMS Gateway**: Konfigurasi integrasi WhatsApp Server / Direct Intent untuk OTP pendaftaran.
- **Telegram Bot Control Center**: Monitoring status webhook dan integrasi bot controller.

### 4. 🤖 Telegram Bot Controller (`@belanjain_zasa_bot`)
Bot Telegram resmi untuk notifikasi pesanan masuk dan pemantauan sistem jarak jauh:
- 🛍️ **Notifikasi Pesanan Baru**: Setiap pesanan baru otomatis dikirimkan ke Chat ID Admin lengkap dengan nama pemesan, PT/departemen, daftar barang, dan total harga.
- ⚡ **Notifikasi Status Pesanan**: Notifikasi instan saat status pesanan diubah menjadi Selesai atau Dibatalkan.
- 📱 **Daftar Perintah Bot:**
  - `/start` atau `/help` — Menampilkan info akun, Chat ID Anda, dan daftar menu perintah.
  - `/myid` — Menampilkan Chat ID Telegram Anda.
  - `/status` — Cek status server, uptime, memori, dan koneksi PostgreSQL.
  - `/testapi` — Menjalankan uji diagnostik API 6 poin secara langsung.
  - `/report` — Laporan eksekutif kesehatan sistem dan statistik database.
  - `/db` — Cek latensi dan total row tabel database.
  - `/stok` — Menampilkan daftar produk dengan stok kritis (< 5 pcs).
  - `/pesanan` — Menampilkan 5 transaksi aktif terbaru.
  - `/selesai [id]` — Mengubah status pesanan menjadi Selesai langsung dari Telegram.
  - `/batal [id] [alasan]` — Membatalkan pesanan dan mengembalikan stok barang ke database.
  - `/clearexceptions` — Membersihkan antrean log error server.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Recharts, Motion, HTML5 QR Code Scanner
- **Backend API**: Node.js, Express 4, esbuild, TypeScript
- **Database & ORM**: PostgreSQL (Neon / Supabase / Vercel Postgres), Drizzle ORM
- **Deployment**: Vercel Serverless Functions (`api/index.ts` & `dist/`)
- **PWA**: Web App Manifest, Service Worker, Custom BelanjaIn SAZA Icons

---

## ⚙️ Variabel Lingkungan (Environment Variables)

Buat file `.env` di direktori root atau tambahkan di **Vercel Project Settings > Environment Variables**:

```env
# Database PostgreSQL
DATABASE_URL=postgresql://username:password@ep-sample-pooler.region.neon.tech/neondb?sslmode=require

# Keamanan JWT
JWT_SECRET=supersecretjwtkey_koperasi_saza

# Telegram Bot Controller
TELEGRAM_BOT_TOKEN=8425375850:AAFFVzDIsC-gVikTyYWfczWGdQ1hy9Zu6IY
TELEGRAM_ADMIN_CHAT_ID=8445262546

# WhatsApp Gateway (Opsional untuk WhatsApp Direct API Server)
WA_API_URL=https://api.fonnte.com/send
WA_API_TOKEN=your_whatsapp_token_here
```

---

## 💻 Panduan Instalasi & Menjalankan Lokal

1. **Clone repositori**:
   ```bash
   git clone https://github.com/daffarizki190/Website_KOKSI.git
   cd Website_KOKSI
   ```

2. **Install dependensi**:
   ```bash
   npm install
   ```

3. **Inisialisasi & Push Skema Database (Drizzle ORM)**:
   ```bash
   npm run db:push
   ```

4. **Jalankan development server**:
   ```bash
   npm run dev
   ```
   Buka di browser: `http://localhost:3000`

5. **Build untuk Produksi**:
   ```bash
   npm run build
   ```

---

## 👥 Akun Demo Bawaan (Default Accounts)

| Role | No. WhatsApp / HP | Password Default | Akses |
| :--- | :--- | :--- | :--- |
| **Admin** | `081234567890` | `admin123` | Portal Admin & Katalog Produk |
| **Karyawan** | `081222333444` | `user123` | Belanja & Riwayat Pesanan |
| **IT Support** | `081299998888` | `it123456` | Dashboard Operasi & Diagnostik IT |

---

## 🔗 Webhook & Integrasi Telegram

Untuk menghubungkan Webhook Telegram ke domain produksi Anda:
1. Kunjungi endpoint:
   `https://www.belanjainsaza.web.id/api/telegram/setup`
2. Endpoint tersebut akan otomatis mendaftarkan webhook URL ke API Telegram.
3. Untuk menguji pengiriman pesan test dari server ke akun Telegram admin:
   `https://www.belanjainsaza.web.id/api/telegram/test`

---

## 📱 Instalasi PWA di HP

1. Buka website di browser Chrome / Safari di HP (`https://www.belanjainsaza.web.id`).
2. Tekan menu browser (ikon titik tiga atau tombol Share).
3. Pilih **"Tambahkan ke Layar Utama" / "Install App"**.
4. Aplikasi BelanjaIn SAZA akan terpasang di HP Anda layaknya aplikasi native dengan logo resmi tas belanja SAZA.
