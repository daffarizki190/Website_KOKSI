# Product Requirements Document (PRD)
**Project Name:** BelanjaIn SAZA (KOKSI) - E-Commerce & Koperasi Karyawan
**Document Status:** Draft

## 1. Problem Statement
Koperasi karyawan saat ini menghadapi kendala dalam mengelola pesanan harian (sembako, makanan siap saji, minuman) secara efisien. Proses pemesanan manual memakan waktu, rawan kesalahan pencatatan, dan menyulitkan pemantauan stok secara real-time. Dibutuhkan sistem E-Commerce terpusat yang bisa diakses multi-device (PWA) untuk memudahkan karyawan berbelanja dan memudahkan admin dalam mengelola pesanan.

## 2. Target User
- **Karyawan (User):** Pengguna akhir yang memesan barang. Menginginkan kemudahan akses (lewat HP), kepastian stok, dan fitur keranjang belanja yang cepat.
- **Admin (Pengelola):** Staf koperasi yang bertugas mengelola katalog produk, menerima pesanan, dan memperbarui status transaksi.
- **IT Operations (HUD):** Tim teknis yang memastikan uptime server, memonitor log, dan mengelola integrasi pihak ketiga (Telegram/WhatsApp).

## 3. User Stories
- Sebagai **Karyawan**, saya ingin dapat memindai barcode produk dengan HP agar bisa menambah barang ke keranjang dengan cepat.
- Sebagai **Karyawan**, saya ingin melihat riwayat pesanan saya agar bisa memantau status pesanan (Proses, Siap, Selesai).
- Sebagai **Admin**, saya ingin mendapatkan notifikasi instan via Telegram saat ada pesanan masuk agar bisa segera menyiapkannya.
- Sebagai **Admin**, saya ingin melihat metrik omset harian agar bisa memantau performa koperasi.
- Sebagai **IT Support**, saya ingin bisa menguji API dan melihat metrik server dari satu dashboard untuk mempercepat troubleshooting.

## 4. Core Features
**MVP (Saat ini sudah ada/berjalan):**
- Autentikasi multi-role (User, Admin, IT).
- Katalog produk dinamis dengan pencarian dan filter.
- Keranjang belanja multi-device.
- Barcode/QR Scanner terintegrasi (HTML5).
- Checkout pesanan dengan integrasi pembatasan jadwal operasional.
- Dashboard Admin (Manajemen Produk, Pengguna, Order, Laporan).
- Notifikasi Webhook Telegram (Bot `@belanjain_zasa_bot`).

**Later (Pengembangan Berikutnya):**
- Web Push Notifications langsung ke browser/HP (sedang dalam proses branch `feature/web-push-notifications`).
- Integrasi Payment Gateway (jika diperlukan selain potong gaji/bayar tunai).
- Sistem pre-order untuk barang kosong.

## 5. Success Metrics
- **Adopsi:** > 80% karyawan aktif menggunakan platform (MAU).
- **Efisiensi:** Rata-rata waktu admin menyiapkan pesanan berkurang 30%.
- **Stabilitas:** Uptime sistem 99.9% (diukur dari metrik IT NOC).

## 6. Edge Cases
- **Stok Kosong Saat Checkout:** Sistem harus memvalidasi stok ulang tepat saat pengguna menekan tombol "Buat Pesanan". Jika gagal, tampilkan pesan error yang jelas.
- **Gagal Kirim Notifikasi Telegram:** Sistem tetap memproses pesanan dan mencatat error log tanpa menggagalkan transaksi (fail-gracefully).
- **Akses di Luar Jam Operasional:** User hanya bisa melihat katalog (Read-only) dan mode checkout dinonaktifkan kecuali dalam Mode Demo.

## 7. Out-of-Scope
- Sistem penggajian/potong gaji internal (HRIS integration).
- Pengiriman logistik antar-kota (hanya berlaku internal pabrik/kantor).
