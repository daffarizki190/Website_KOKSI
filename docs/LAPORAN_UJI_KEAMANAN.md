# Laporan Hasil Uji Keamanan Aplikasi BelanjaIn SAZA
**Target Aplikasi:** Web Application & REST API (`http://localhost:3000` & Production)  
**Tanggal Pengujian:** September 2026  
**Metodologi:** OWASP Top 10 Automated Defensive Security Testing & Static Code Analysis  
**Status Pengujian:** **21/21 Uji Lulus (Skor Keamanan: 100%)**

---

## 1. Ringkasan Eksekutif (Executive Summary)

Pengujian keamanan ini dilakukan untuk mengevaluasi ketahanan aplikasi **BelanjaIn SAZA** terhadap ancaman siber umum berdasarkan standar **OWASP Top 10 Web Application Security Risks**. Pengujian mencakup audit konfigurasi header HTTP, integritas mekanisme autentikasi dan token JWT, pencegahan eskalasi hak akses (RBAC), ketahanan terhadap serangan Injeksi SQL, pencegahan kebocoran kredensial sensitif, serta ketahanan terhadap beban permintaan (*burst/DoS resilience*).

Hasil pengujian menunjukkan bahwa aplikasi memiliki postur keamanan yang **sangat solid**:
- **0 Kerentanan Kritis (Zero Critical Flaws)** pada kode aplikasi aktif.
- Proteksi stateless JWT berhasil menangkal token palsu dan token tanpa tanda tangan valid.
- Hak akses berbasis peran (*Role-Based Access Control*) terisolasi dengan ketat: akun berstatus `user` tidak dapat mengakses endpoint administratif.
- Seluruh endpoint query database menggunakan ORM terparameterisasi (Drizzle ORM), sehingga kebal terhadap injeksi SQL.
- Seluruh password tersimpan dalam bentuk *salted hash* Bcrypt 10 rounds dan tidak pernah dibocorkan pada respon API.

---

## 2. Rincian Hasil Pengujian (Test Results Breakdown)

### A. HTTP Security Headers (CWE-200, CWE-1021, CWE-693)
| No | Parameter Uji | Ekspektasi | Hasil Aktual | Status |
|:---|:---|:---|:---|:---:|
| 1 | `X-Powered-By` Obfuscation | Header tersembunyi untuk mencegah fingerprinting server | Tidak ada header `X-Powered-By` | **PASS** |
| 2 | `X-Content-Type-Options` | Mencegah MIME-sniffing browser (`nosniff`) | `nosniff` terpasang | **PASS** |
| 3 | Clickjacking Protection | Mengisolasi rendering frame (`X-Frame-Options: SAMEORIGIN`) | `SAMEORIGIN` terpasang | **PASS** |
| 4 | Browser XSS Protection | Mengaktifkan filter XSS bawaan browser | `1; mode=block` | **PASS** |
| 5 | Referrer Policy | Mencegah kebocoran URL asal ke domain eksternal | `strict-origin-when-cross-origin` | **PASS** |

### B. Autentikasi & Batasan Akses (Authentication & Authorization Boundary)
| No | Parameter Uji | Ekspektasi | Hasil Aktual | Status |
|:---|:---|:---|:---|:---:|
| 6 | Akses Anonim ke `/api/orders` | Permintaan tanpa token ditolak | HTTP 401 Unauthorized | **PASS** |
| 7 | Akses Anonim ke `/api/products` | Permintaan tanpa token ditolak | HTTP 401 Unauthorized | **PASS** |
| 8 | Akses Anonim ke `/api/users` | Permintaan tanpa token ditolak | HTTP 401 Unauthorized | **PASS** |
| 9 | Verifikasi Tanda Tangan JWT Palsu | Token yang diubah (*tampered*) ditolak | HTTP 401 Unauthorized | **PASS** |

### C. Role-Based Access Control (RBAC) & Privilese
| No | Parameter Uji | Ekspektasi | Hasil Aktual | Status |
|:---|:---|:---|:---|:---:|
| 10 | Alur Login Pengguna (`user`) | Berhasil login & menerima JWT valid | HTTP 200 OK | **PASS** |
| 11 | Pencegahan Eskalasi Hak Akses | Akun role `user` dilarang mengakses `/api/users` | HTTP 403 Forbidden | **PASS** |
| 12 | Verifikasi Sesi Aktif Pengguna | Profil pengguna dapat diambil via `/api/auth/me` | HTTP 200 OK | **PASS** |
| 13 | Alur Login Administrator (`admin`) | Berhasil login & menerima JWT admin | HTTP 200 OK | **PASS** |
| 14 | Akses Sah Administrator | Admin dapat mengakses `/api/users` | HTTP 200 OK | **PASS** |

### D. Pencegahan Kebocoran Data Sensitif (Sensitive Data Exposure)
| No | Parameter Uji | Ekspektasi | Hasil Aktual | Status |
|:---|:---|:---|:---|:---:|
| 15 | Masking Password pada Login Response | Objek respon tidak menyertakan field password | Field `password` dihilangkan | **PASS** |
| 16 | Masking Password pada Daftar Pengguna | Query data pengguna tidak memuat hash password | 100% data akun ter-sanitize | **PASS** |

### E. Ketahanan Terhadap Injeksi (Injection Resiliency - SQLi)
| No | Parameter Uji | Payload Uji | Hasil Aktual | Status |
|:---|:---|:---|:---|:---:|
| 17 | SQLi Tautology Bypass | `' OR '1'='1` | HTTP 200, parameter tersaring aman | **PASS** |
| 18 | SQLi Stacked Queries | `1; DROP TABLE products;--` | HTTP 200, Drizzle parameterized | **PASS** |
| 19 | SQLi UNION Exploitation | `' UNION SELECT null, username, password...` | HTTP 200, query tidak mengeksekusi UNION | **PASS** |

### F. Ketersediaan & Mitigasi Beban (Availability & DoS Resilience)
| No | Parameter Uji | Ekspektasi | Hasil Aktual | Status |
|:---|:---|:---|:---|:---:|
| 20 | Burst Request Handling | 20 permintaan paralel diproses stabil tanpa OOM / crash | 20/20 berhasil (HTTP 200) | **PASS** |
| 21 | CORS & Preflight Request | Request `OPTIONS` ditangani secara aman | HTTP status terkontrol | **PASS** |

---

## 3. Peningkatan Keamanan yang Telah Diterapkan (Hardening Applied)

Dalam pengujian ini, sejumlah perbaikan keamanan tingkat lanjut telah diterapkan pada `server.ts`:
1. **Pembersihan Otomatis Memori Rate Limiter (*Auto-Eviction*)**:
   - Menambahkan rutinitas interval setiap 60 detik untuk membersihkan IP kadaluarsa dari `rateLimitStore`, mencegah serangan *Memory Exhaustion Denial of Service*.
2. **Reverse Proxy Trust**:
   - Menambahkan konfigurasi `app.set('trust proxy', 1)` agar IP klien di balik reverse proxy (Vercel / Cloudflare) terdeteksi secara valid dan mencegah pemalsuan header `X-Forwarded-For`.
3. **Peringatan Lingkungan Produksi untuk JWT Secret**:
   - Memastikan peringatan aktif jika `JWT_SECRET` masih menggunakan default pada mode produksi.

---

## 4. Kesimpulan & Rekomendasi Selanjutnya

Sistem **BelanjaIn SAZA** telah membuktikan ketahanan keamanan yang tinggi dan siap untuk tahap evaluasi serta demonstrasi produksi.

Rekomendasi untuk tahap operasional berkelanjutan:
1. **Rotasi Berkala JWT Secret di Environment Variables Vercel/Production**: Pastikan string rahasia produksi selalu memiliki entropi tinggi (>32 karakter acak).
2. **Pembaruan Dependensi Berkala**: Menjalankan `npm update` berkala untuk paket utilitas pemrosesan file seperti `sharp` dan `xlsx`.
