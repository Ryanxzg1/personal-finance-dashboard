# Changelog

Semua perubahan penting pada proyek **Buku Kas (Buku Keuangan Pribadi)** akan dicatat di file ini.
Format ini didasarkan pada [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), dan proyek ini mengikuti [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0-beta.4] - 2026-07-05

### Added
- **Skema Database**: Menambahkan tabel `weekly_report_deliveries` untuk pelacakan pengiriman laporan.

### Changed
- **Autentikasi & Keamanan**: Memfaktorkan ulang logika transfer untuk meningkatkan akurasi pencarian dompet (account lookup) dan keamanan kepemilikan data pengguna.

### Fixed
- **Dokumentasi & Audit**: Pembersihan dan penyelesaian seluruh temuan audit keamanan dan keandalan data (M-01 s/d M-10 dan L-01 s/d L-06) dalam status administratif.
  - Sinkronisasi edit saldo akun agar tercatat di database (M-01).
  - Penerapan composite unique constraints pada kategori dan anggaran bulanan (M-02).
  - Penanganan timezone dengan `timestamptz` untuk mencegah pergeseran periode (M-03).
  - Explicit casting numeric ke text pada query pencarian global (M-04).
  - Rollback state pada kegagalan optimistic UI dan perbaikan budget alert (M-05).
  - Implementasi rate limiter serverless yang aman (M-06).
  - Pelengkapan variabel lingkungan `.env.example` (M-07).
  - Server-side pagination dan filtering untuk database transaksi (M-08).
  - Inisialisasi testing pipeline dan konfigurasi CI (M-09).
  - Penyesuaian konfigurasi HSTS dan CSP untuk pengerasan keamanan produksi (M-10).
  - Penyesuaian filter stats API (L-01), validasi input numeric (L-02), penonaktifan HTTP GET fix-db (L-03), pembersihan lint warning (L-04), perbaikan tautan README (L-05), dan pembersihan script check-db (L-06).

### Removed
- **Sisa Konfigurasi**: Menghapus *generated file* dan mengabaikan `next-env.d.ts` dari repositori.

## [1.0.0-beta.3] - 2026-06-07

### Added
- **PWA (Progressive Web App)**: Implementasi *service worker* untuk dukungan luring (*offline support*) dan manajemen *manifest*.
- **UX Finansial**: Menambahkan *Optimistic UI* pada operasi transfer dana antar dompet agar antarmuka terasa lebih instan tanpa menunggu respons *backend*.

### Changed
- **Branding**: Pembaruan nama aplikasi menjadi **Buku Keuangan Pribadi** secara konsisten di *layout*, *manifest*, dan *service worker*.
- **Desain UI**: Pembaruan *styling* *layout dashboard* utama serta penyesuaian spasi *bottom navigation* dan tipografi demi kesejajaran visual yang lebih baik.
- **Backend**: Pembersihan duplikasi kode dengan menghapus *action reset database* berlebih.

## [1.0.0-beta.2] - 2026-05-24

### Added
- **Notifikasi Email**: Implementasi pembuatan dan pengiriman laporan keuangan mingguan secara otomatis menggunakan *cron job*.
- **Kepatuhan Privasi (GDPR)**: Fitur penghapusan data pengguna secara atomik dan menyeluruh melalui integrasi *webhooks* Clerk, lengkap dengan halaman kebijakan hukum privasi (*legal policy pages*).

### Changed
- **Refactoring Skema**: Pembersihan definisi tipe statis (*type definitions*), penegakan *strict typing*, dan penghapusan *field* statis `icon` yang tidak digunakan pada kategori.

### Security
- **Proteksi IDOR**: Implementasi lapis keamanan *Insecure Direct Object Reference* secara ketat pada mutasi *database actions*.
- **Restriksi Environment**: Restriksi jalur pembaruan skema DDL (*database migration route*).
- **Performa & Indeks**: Optimasi skema indeks kolom untuk menjamin integritas *lookup* antar tabel Drizzle ORM.

## [1.0.0-beta.1] - 2026-05-06

### Added
- **Manajemen Akun & Tabungan**: Rilis awal fitur manajemen dompet (*Accounts*), Kategori (*Categories*), pengaturan batasan anggaran bulanan (*Budgets*), dan pelacakan tabungan (*Savings Goals*). Termasuk penanganan interaksi klien ke server.
- **Transaksi Arus Kas**: Rilis halaman riwayat transaksi yang mendukung *filtering*, *sorting*, ekspor data laporan (*export functionality*), dan penambahan cepat melalui *dashboard* terpusat.
- **Pemetaan Alokasi (Blueprint)**: Penambahan fitur perencanaan *mapping plan* untuk alokasi pengeluaran esensial versus non-esensial.
- **Search & Navigation**: Menu perintah global interaktif (Cmd+K) untuk pencarian cepat *real-time* terhadap riwayat transaksi, dompet, dan kategori.
- **Visualisasi Data**: Statistik *dashboard* visual dan diagram interaktif, mendukung notifikasi peramban (*browser push notifications*).
- **Core Integrations**: Pengikatan skema basis data dengan Neon (PostgreSQL) melalui Drizzle ORM.
- **Autentikasi**: Integrasi *gateway* masuk terpusat dengan penyedia identitas Clerk.

---
*Dokumen historis ini dibangun dan dipertahankan secara akurat berdasarkan riwayat log version control (Git) dan diperbarui secara berkala pada setiap rilis.*
