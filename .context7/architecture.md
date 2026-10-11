# Context7 Architecture & System Specification: BelanjaIn Saza (Website KOKSI)

## 1. Overview & System Purpose
**BelanjaIn Saza** adalah platform e-commerce dan operasional koperasi karyawan internal PT. Siemens Indonesia yang melayani pemesanan barang, verifikasi barcode fisik di kasir, manajemen stok, serta layanan bantuan pelanggan (Live Chat Support) berbasis PWA (Progressive Web Application).

---

## 2. Core Architecture & Tech Stack

### Frontend Architecture
- **Framework**: React 19 + TypeScript + Vite 6
- **Routing**: `react-router-dom` (v7) with declarative auth guards & page transitions (`PageTransition`)
- **Styling**: Tailwind CSS v4, Lucide Icons
- **Animation**: `motion/react` (Motion v12)
- **Modals & Overlays**: React `createPortal` to `document.body` with `z-[9999]` to guarantee proper viewport fixed positioning without CSS transform containment bugs on mobile.
- **PWA & Offline Capability**:
  - Service Worker + Web App Manifest
  - Touch-optimized native buttons with `touch-manipulation` and `active:scale-95`
  - Mobile bottom navigation with sticky cart and badge counters

### Backend & API Architecture
- **Runtime**: Node.js + Express
- **Language**: TypeScript (`tsx` in dev, `esbuild` for production bundles)
- **Database & ORM**: PostgreSQL (hosted on Neon Tech) + Drizzle ORM
- **Security Hardening**:
  - JWT Authentication (`requireAuth`, `requireAdmin`, `requireIT`)
  - Helmet with essential HTTP headers (`nosniff`, `SAMEORIGIN`)
  - Express Rate Limiting & brute-force lockdown
  - Idempotency Engine (`Idempotency-Key` header & request body) preventing duplicate order transactions

---

## 3. Strict Business Rules & Invariants
1. **Jadwal Operasional Belanja**:
   - Pemesanan online hanya dibuka pada hari **Senin** dan **Selasa** (WIB).
   - Di luar hari tersebut (Rabu s/d Minggu), sistem secara otomatis mengunci checkout kecuali jika `demoMode` aktif.
2. **Idempotency Checkout (Prevent Double Billing)**:
   - Setiap checkout mengirimkan `Idempotency-Key` unik.
   - Jika pengguna menekan tombol checkout berulang kali atau terjadi retry jaringan, request kedua akan mengembalikan pesanan yang sama tanpa memotong stok atau membuat transaksi ganda.
3. **Verifikasi Pengambilan Barang (One-Time QR Barcode)**:
   - Setiap pesanan aktif menghasilkan token QR barcode unik dengan masa berlaku terbatas.
   - Petugas kasir memindai barcode via `/admin/scan` untuk menandai pesanan selesai. Barcode hanya dapat digunakan 1 kali.
4. **Chat Live Support**:
   - Pengguna dengan role `user` dapat langsung chat dengan Admin Koperasi.
   - Pesan tersinkronisasi dua arah dengan live polling dan real-time dispatch.

---

## 4. Role-Based Access Control (RBAC)
- **Role `user`**: Menjelajahi katalog, mengelola keranjang, melakukan checkout, melihat riwayat barcode, dan Chat Admin.
- **Role `admin`**: Mengelola produk, stok, harga, melihat seluruh pesanan masuk, memverifikasi barcode scan, dan membalas Chat Live.
- **Role `it`**: Memantau audit logs, metrik performa sistem, mengubah role user, dan maintenance.

---

## 5. Automated Testing & Verification (Playwright CLI)
- **Configuration**: [playwright.config.ts](file:///c:/Users/MyBook%20Hype%20AMD.FAIZZXHYPE7/OneDrive/Dokumen/My%20Project/Website_KOKSI/playwright.config.ts)
- **Test Specs**:
  - `e2e/mobile-chat.spec.ts`: Verifikasi interaksi tombol chat pada emulasi Mobile Chrome / PWA Viewport (Header, Bottom Nav, Floating Button).
  - `e2e/security-strix.spec.ts`: STRIX Penetration Suite (RBAC, SQL injection resistance, idempotency duplicate prevention, and security headers).
- **Execution Commands**:
  - `npm run test:e2e` (Semua test)
  - `npm run test:e2e:mobile` (Khusus simulasi HP/PWA)
