# Buku Kas - Personal Finance Dashboard 🚀

Buku Kas adalah aplikasi manajemen keuangan pribadi (*Personal Finance Dashboard*) modern yang dibangun dengan Next.js. Aplikasi ini dirancang untuk keamanan tingkat produksi, performa tinggi, dan pengalaman pengguna yang intuitif.

## 🛠️ Tech Stack
- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Auth**: [Clerk](https://clerk.com/)
- **Database**: [PostgreSQL (Neon DB)](https://neon.tech/)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Styling**: Tailwind CSS & shadcn/ui
- **Email**: Resend API & React-Email

## 🚀 Persiapan Cepat (Development)

1. **Clone repositori**:
   ```bash
   git clone <repository-url>
   cd personal-finance-dashboard
   ```

2. **Instalasi Dependensi**:
   ```bash
   pnpm install
   ```

3. **Konfigurasi Environment**:
   Salin `.env.example` ke `.env.local` dan isi kredensial yang diperlukan:
   - `DATABASE_URL`: Koneksi string Neon DB.
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` & `CLERK_SECRET_KEY`: Kunci API Clerk.
   - `RESEND_API_KEY`: Kunci API Resend untuk email laporan.

4. **Migrasi Database**:
   ```bash
   pnpm db:push
   ```

5. **Jalankan Server**:
   ```bash
   pnpm run dev
   ```

## 🏗️ Deployment Produksi

Aplikasi ini siap dideploy ke platform seperti Vercel atau VPS mandiri.

**Untuk VPS Mandiri:**
```bash
pnpm run build
pnpm run prod
```
*Perintah `prod` akan menjalankan server pada `0.0.0.0` sehingga dapat diakses dalam jaringan lokal/publik.*

## 🗄️ Manajemen Database
Kami menggunakan Drizzle untuk manajemen skema:
- `pnpm db:generate`: Menghasilkan file migrasi SQL.
- `pnpm db:migrate`: Menerapkan migrasi ke database target.
- `pnpm db:push`: Sinkronisasi skema langsung (disarankan hanya untuk dev).

## 🛡️ Keamanan & Optimasi
- **IDOR Protection**: Verifikasi kepemilikan data pada setiap request.
- **Rate Limiting**: Pembatasan request untuk mencegah abuse.
- **Security Headers**: CSP, HSTS, dan X-Frame-Options terkonfigurasi.
- **Strict Typing**: TypeScript Strict Mode aktif untuk stabilitas kode.

## 📄 Lisensi & Dokumentasi
Dokumentasi internal lebih lanjut tersedia di folder `ryan_workspace/docs/`.
- [Project Documentation](./ryan_workspace/docs/project_documentaion.md)
- [Incident Runbook](./ryan_workspace/docs/runbook.md)
- [Backup & Recovery Strategy](./ryan_workspace/docs/backup_strategy.md)

---
*Dikembangkan dengan oleh Ryan dan dibantu oleh Gemini.*
