# CONTEX.md — Buku Kas (Personal Finance Dashboard)

> Single Source of Truth teknis untuk repo ini. Dokumen ini adalah **peta arsitektur yang stabil**.
> Status audit/backlog **tidak disalin ke sini** — lihat [ryan_workspace/current_condition.md](./ryan_workspace/current_condition.md)
> (catatan: folder `ryan_workspace/` ada di `.gitignore`, hanya tersedia lokal).
> Aturan kerja agent ada di [AGENTS.md](./AGENTS.md).

## 1. Ringkasan Produk

Aplikasi keuangan pribadi multi-user bernama **Buku Kas / Buku Keuangan Pribadi** (UI berbahasa Indonesia, `lang="id"`).
Fitur: dashboard arus kas, riwayat transaksi (cursor pagination + ekspor PDF/Excel), multi-dompet + transfer, kategori & anggaran bulanan,
target tabungan, pemetaan dana (blueprint), laporan mingguan via email, PWA/offline, penghapusan data otomatis (GDPR) saat akun Clerk dihapus.

## 2. Tech Stack (dari `package.json`)

| Area | Teknologi |
|---|---|
| Framework | Next.js 16.2.6 (App Router), React 19, TypeScript 6 (`strict`) |
| Package manager | pnpm 10.33.4 |
| Auth | Clerk (`@clerk/nextjs`) + webhook via `svix` |
| Database | PostgreSQL di Neon, driver `@neondatabase/serverless` (**neon-http**) |
| ORM / migrasi | Drizzle ORM + drizzle-kit (output `./drizzle`) |
| UI | Tailwind CSS v4, shadcn/ui (Radix), lucide-react, recharts, framer-motion, sonner |
| Form / validasi | react-hook-form + Zod 4 |
| Email / PDF / Excel | Resend, `@react-email/components`, jsPDF + autotable, `xlsx` (tarball vendored di `vendor/`) |
| Deploy | Vercel (`vercel.json` memuat cron), PWA (`public/sw.js`, `manifest.webmanifest`) |

Bukan proyek QUANTUMS ERP / CodeIgniter / Oracle.

## 3. Struktur Direktori

| Path | Tanggung jawab |
|---|---|
| `proxy.ts` | Clerk middleware (pengganti `middleware.ts` di Next 16): proteksi rute, CORS untuk `/api`, daftar rute publik |
| `app/(dashboard)/` | Halaman terproteksi: `page.tsx` (dashboard), `riwayat`, `kategori`, `tabungan`, `pemetaan`, `pemetaan/[id]`, plus `layout/loading/error` |
| `app/sign-in`, `app/sign-up`, `app/legal/*`, `app/offline` | Halaman publik |
| `app/api/` | Route handlers: `stats`, `transactions`, `categories`, `webhooks/clerk`, `cron/weekly-report`, `fix-db` |
| `lib/actions/` | **Server Actions** (`"use server"`) — pusat logika bisnis & mutasi data |
| `lib/queries/transactions.ts` | Query transaksi dengan cursor pagination (`getTransactionsQuery`, `encodeCursor`, `decodeCursor`) |
| `lib/validations/` | Skema Zod (`transaction`, `transaction-query`, `category`, `budget`, `account`, `savings`) |
| `lib/db/schema.ts`, `lib/db/index.ts` | Skema Drizzle dan instance `db` (neon-http; throw jika `DATABASE_URL` kosong) |
| `lib/helpers/transaction.ts` | `TECHNICAL_CATEGORIES`, `isTechnicalTransaction`, `isReportableTransaction` |
| `lib/reports/weekly.ts` | Window laporan mingguan (WIB), ringkasan transaksi |
| `lib/export-utils*.ts` | Ekspor PDF/Excel; dipecah `.browser` / `.server` / `.shared`, `export-utils.ts` memakai dynamic import |
| `lib/id-codec.ts` | `encodeId`/`decodeId` (Base62 + offset) untuk URL `pemetaan/[id]` — **obfuscation, bukan keamanan** |
| `lib/notifications.ts` | Helper notifikasi browser + registrasi service worker |
| `components/finance/<modul>/` | Komponen fitur per modul (accounts, categories, dashboard, layout, mapping, savings, transactions) |
| `components/ui/` | Primitive shadcn/ui |
| `emails/` | Template React-Email |
| `drizzle/` | Migrasi SQL (`0000`–`0002`) dan snapshot |
| `hooks/` | `use-mobile`, `use-toast` |

Path alias (`tsconfig.json`): `@/*` → root, plus `@actions/*`, `@validations/*`, `@db/*`, `@components/*`, `@hooks/*`.

## 4. Data Model (`lib/db/schema.ts`)

Semua tabel kecuali `blueprint_items` membawa `user_id` (Clerk user id, `varchar(255)`) — **tidak ada FK ke tabel user**; isolasi data murni lewat filter `userId` di query.

| Tabel (export) | Kolom utama | Catatan |
|---|---|---|
| `transactions` | `amount numeric(12,2)`, `category varchar`, `type` ('income'/'expense'), `account_id` → `accounts` (cascade, nullable), `date` | 5 index termasuk `(user_id, date desc, id desc)` untuk pagination |
| `categories` | `name`, `type` | |
| `personal_budgets` (`budgets`) | `category_id` → `categories` (cascade), `limit_amount`, `month`, `year` | |
| `accounts` | `name`, `type`, `initial_balance`, `color` | |
| `savings_goals` | `target_amount`, `current_amount`, `monthly_target`, `deadline` | |
| `weekly_report_deliveries` | `period_start/end` (timestamptz), `status`, `attempt_count`, `resend_email_id` | Unique `(user_id, period_start, period_end)` untuk idempotency |
| `blueprint_plans` | `name`, `start_date`, `end_date` | relasi `many` ke items |
| `blueprint_items` | `plan_id` → plans (cascade), `description`, `amount`, `is_essential` | tidak punya `user_id`; kepemilikan lewat plan |

Konvensi data: `amount` disimpan **absolut (positif)**; arah ditentukan `type`. Kolom `timestamp` lama tanpa timezone, hanya `weekly_report_deliveries` memakai `timestamptz`.

## 5. Alur Kunci

1. **Auth & akses** — `proxy.ts` menjalankan `auth.protect()` untuk semua rute kecuali: `/sign-in`, `/sign-up`, `/legal`, `/offline`, `/manifest.webmanifest`, `/sw.js`, `/icon-pwa.png`, `/api/webhooks/clerk`, `/api/cron/weekly-report`. Server Action dan route handler tetap memanggil `auth()` sendiri dan mengembalikan `Unauthorized`.
2. **Pola Server Action** — `auth()` → validasi Zod → cek kepemilikan resource (anti-IDOR) → query Drizzle → `revalidatePath` → return `{ success, data | error }`; error di-`console.error` dengan pesan generik ke klien.
3. **Transaksi** — `createTransaction`, `updateTransaction`, `deleteTransaction`, `getTransactions`, `getTransactionsPaginated` (cursor).
4. **Transfer antar dompet** — `transferFunds` memverifikasi kepemilikan kedua akun, lalu **satu multi-row INSERT** (dua transaksi: expense `Transfer Keluar`, income `Transfer Masuk`) agar atomik di neon-http.
5. **Saldo akun** — `adjustAccountBalance` (di `lib/actions/accounts.ts`) menyesuaikan saldo; saldo berjalan diturunkan dari `initial_balance` + transaksi (sesuai dokumentasi proyek; formula belum diverifikasi baris per baris).
6. **Laporan mingguan** — Vercel Cron Senin 00:00 UTC → `GET /api/cron/weekly-report` (wajib `Authorization: Bearer $CRON_SECRET`) → `runWeeklyReportHeadless` → Resend + PDF; progres dicatat di `weekly_report_deliveries`. `sendWeeklyReport` untuk sesi user.
7. **GDPR** — webhook Clerk `user.deleted` (verifikasi svix pada raw body) → `db.batch` hapus data user di 6 tabel.
8. **Ekspor** — PDF/Excel dari browser (`export-utils.browser`), PDF server untuk lampiran email.
9. **Security headers** — `next.config.mjs` mengatur X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy, CSP.

## 6. Environment Variables (nama saja, lihat `.env.example`)

`DATABASE_URL`, `TEST_DATABASE_URL`, `RESEND_API_KEY`, `REPORT_FROM_EMAIL`, `REPORT_RECIPIENT_OVERRIDE` (non-prod saja),
`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`, `CRON_SECRET`, `ALLOWED_ORIGINS`,
`NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL`.

## 7. Command

| Tujuan | Command |
|---|---|
| Dev server | `pnpm dev` (webpack, host 0.0.0.0) |
| Typecheck / Lint | `pnpm typecheck` / `pnpm lint` |
| Build / Start | `pnpm build` / `pnpm start` |
| Gate lengkap | `pnpm ci:verify` (typecheck + lint + build + `audit:prod`) |
| Migrasi | `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:push` |
| Preview email | `pnpm email` |

Tidak ada script `test` dan tidak ada file test di repo saat ini.

## 8. Dependency Map (verified)

- UI → `lib/actions/*` → `lib/db` + `lib/validations/*` (+ `lib/queries/transactions.ts`, `lib/helpers/transaction.ts`).
- `app/api/transactions` & `app/api/stats` → `db`/`lib/queries` langsung (bypass Server Actions).
- `app/api/cron/weekly-report` → `lib/actions/reports.ts` → `lib/reports/weekly.ts`, `lib/export-utils.server.ts`, `emails/`.
- `app/api/webhooks/clerk` → `db` langsung.
- Ada dua definisi `isReportableTransaction`: `lib/helpers/transaction.ts` dan `lib/reports/weekly.ts` (duplikasi).

## 9. Hal yang Perlu Diwaspadai (observasi dari kode, bukan daftar audit)

- **Neon-http tidak mendukung interactive transaction.** Atomisitas hanya via single statement atau `db.batch`.
- **Kemungkinan inkonsistensi kategori teknis:** `transferFunds` memakai kategori `"Transfer Keluar"`/`"Transfer Masuk"`, sedangkan `TECHNICAL_CATEGORIES` berisi `"Transfer"` dengan pencocokan `includes` eksak. Perlu diverifikasi apakah transfer ikut terhitung di laporan/statistik.
- `app/api/fix-db/route.ts` adalah endpoint DDL manual, dibatasi `NODE_ENV === "development"`.
- `proxy.ts` memakai fallback CORS `https://your-domain.com` jika `ALLOWED_ORIGINS` kosong.
- Webhook GDPR belum menghapus `weekly_report_deliveries` (lihat audit H-05 di `current_condition.md`).
- `eslint.config.js` mereferensikan `lib/logger.ts` yang tidak ada.
- `.env.local` ada di working tree (di-ignore git); jangan pernah di-commit atau dikutip isinya.
