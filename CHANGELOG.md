# Changelog

Semua perubahan penting pada proyek **Buku Kas** akan dicatat di file ini.
Format ini didasarkan pada [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), dan proyek ini mengikuti [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0-beta.2] - 2026-05-24

### Added
- **Dokumentasi**: Menambahkan `README.md` produksi yang komprehensif.
- **Operasional**: Menambahkan `docs/runbook.md` untuk panduan troubleshooting incident.
- **Changelog**: Inisialisasi file `CHANGELOG.md`.

### Changed
- **Refactoring Roadmap**: Merapikan `production_readiness.md` untuk visibilitas backlog yang lebih baik.

## [1.0.0-beta.1] - 2026-05-23

### Added
- **Email Reports**: Implementasi sistem laporan mingguan otomatis via Resend & React-Email.
- **Export Feature**: Kemampuan ekspor riwayat transaksi ke PDF dan Excel.
- **Security**: Implementasi Rate Limiting dan HTTP Security Headers.

### Changed
- **Simplifikasi Proyek**: Menghapus infrastruktur testing (Vitest/Playwright) dan Sentry sesuai arahan pengembang.
- **Linting**: Pembersihan >80 masalah linting dan optimasi tipe data TypeScript.

## [0.9.0] - 2026-05-20

### Added
- **Core Features**: Transaksi, Transfer Antar Dompet, Anggaran Bulanan, dan Target Tabungan.
- **Auth**: Integrasi Clerk untuk manajemen pengguna.
- **Database**: Skema awal dengan Drizzle ORM dan Neon DB.

---
*Laporan ini diperbarui secara berkala.*
