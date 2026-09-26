# Rekap Pembaruan Sistem KOKSI

Berikut adalah ringkasan seluruh perbaikan dan fitur baru yang telah ditambahkan ke dalam sistem:

## 1. Perbaikan Backend & Database (Error 500)
- **Skema Database**: Menambahkan tabel `settings` ke dalam konfigurasi `src/db/schema.ts` (yang sebelumnya hilang dan menyebabkan crash).
- **Sinkronisasi**: Menjalankan `drizzle-kit push` sehingga database selaras dengan aplikasi. Error 500 pada endpoint `/api/orders` saat startup berhasil dihilangkan.

## 2. Dashboard Admin & Filter
- **Filter Mingguan (Kalender)**: Mengubah filter periode menjadi input kalender biasa (`type="date"`) agar admin bisa dengan mudah memilih tanggal atau bulan sebelumnya. Sistem secara otomatis akan menampilkan transaksi untuk **satu minggu penuh** (Senin - Minggu) berdasarkan tanggal yang dipilih.
- **Tampilan Filter**: Menambahkan badge aktif yang menampilkan informasi rentang tanggal dengan rapi (misal: "Periode: 15 Sep 2026 - 21 Sep 2026").
- **Daftar Pesanan**: Memastikan status dan riwayat pembayaran sinkron.

## 3. Sistem Barcode & Scanner
- **Format Nomor Barcode**: Menyeragamkan prefix Barcode cetak menjadi `KOKSI-[ID_PESANAN]` dan menyembunyikan angka di bawah barcode agar terlihat lebih bersih.
- **Perbaikan Kinerja Scanner**: 
  - Menghapus batasan kotak (viewfinder persegi) agar kamera memindai di seluruh layar penuh. Ini sangat membantu pemindaian Barcode 1D yang berbentuk panjang/lebar.
  - Meningkatkan Frame Rate (FPS) pemindai dari 10 menjadi 15 agar lebih responsif.
  - Menambahkan logika parsing pintar yang memisahkan teks `KOKSI-` sehingga ID Pesanan terbaca dengan akurat.
- **Sinkronisasi Update Scanner**: Memperbaiki masalah "progress tidak update". Kini saat status diubah menggunakan Scanner, sistem juga akan mengirimkan **Keterangan / Catatan** progresnya. Sehingga, riwayat pesanan di sisi User akan ikut diperbarui teks statusnya secara real-time.

## 4. Halaman User (Order & Riwayat)
- **Peringatan Keranjang (> Rp 300.000)**: Menambahkan peringatan otomatis di `DashboardUser.tsx` jika total belanja melebihi 300k, beserta catatan kecil bahwa karena sistem pembayaran online belum aktif, pembayaran lebih nominal tersebut harus disesuaikan secara manual.
- **Tampilan Catatan per Produk**: Menambahkan fitur untuk menampilkan `catatan` spesifik pada tiap barang langsung di halaman **Riwayat Pesanan** (`OrderHistory.tsx`), sehingga pembeli maupun admin dapat melihat request khusus pada tiap produk (misal: "Esnya dipisah").

## 5. Terminologi Status
- Menggunakan standar kata **"Pengiriman"** untuk proses kirim, dan membersihkan status usang seperti "Selesai" dari visibilitas tracking utama sesuai kesepakatan aturan sebelumnya.

---
*Diperbarui pada: September 2026*
