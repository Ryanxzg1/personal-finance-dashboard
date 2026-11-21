# AGENTS.md — Panduan Agent untuk Buku Kas

Baca [CONTEX.md](./CONTEX.md) lebih dulu untuk arsitektur, data model, dan alur. File ini berisi **aturan kerja**.
Status audit/backlog: [ryan_workspace/current_condition.md](./ryan_workspace/current_condition.md) (lokal, di-`.gitignore`).

## 1. Setup & Validasi

- Package manager: **pnpm** (jangan pakai npm/yarn; `pnpm-lock.yaml` adalah lockfile).
- Dev: `pnpm dev`. Gate sebelum menyatakan selesai: `pnpm typecheck` → `pnpm lint` → `pnpm build`. Gate penuh: `pnpm ci:verify`.
- Migrasi: ubah `lib/db/schema.ts` → `pnpm db:generate` → review SQL di `drizzle/` → `pnpm db:migrate`. Jangan `db:push` ke database produksi.
- Belum ada test runner. Jangan mengklaim "test lulus"; sebutkan jelas bila hanya typecheck/lint/build yang dijalankan.
- Jangan membaca, mencetak, atau meng-commit `.env.local`. Gunakan `.env.example` sebagai referensi nama variabel.

## 2. Konvensi Kode (terverifikasi dari repo)

- **Stack:** Next.js 16 App Router, React 19, TypeScript `strict`. Alias `@/*` (juga `@actions/*`, `@validations/*`, `@db/*`, `@components/*`, `@hooks/*`).
- **Logika bisnis di Server Actions** (`lib/actions/*.ts`, `"use server"`). Urutan wajib: `auth()` → validasi Zod → cek kepemilikan resource → query Drizzle → `revalidatePath` → return `{ success: true, data } | { success: false, error }`.
- **Setiap query data user wajib difilter `userId`** dari `auth()`, tidak pernah dari input klien. Resource yang direferensikan (mis. `accountId`, `categoryId`, `planId`) wajib diverifikasi milik `userId` (anti-IDOR). `blueprint_items` tidak punya `user_id`; verifikasi lewat `blueprint_plans`.
- **Validasi input** memakai skema Zod di `lib/validations/`. Tambahkan skema baru di sana, jangan inline di komponen.
- **Uang:** kolom `numeric` dibaca/ditulis sebagai string. `amount` transaksi disimpan absolut (positif); arah ditentukan `type`.
- **Error handling:** tidak ada `catch` kosong; log via `console.error` dengan konteks, kembalikan pesan generik ke klien. ESLint mengizinkan hanya `console.warn`/`console.error`.
- **Pesan UI/error berbahasa Indonesia**, identifier kode berbahasa Inggris.
- **UI:** komponen fitur di `components/finance/<modul>/`, primitive di `components/ui/` (shadcn). Gunakan `cn` dari `lib/utils.ts` dan token Tailwind v4 yang sudah ada.
- Ekspor PDF/Excel melalui `lib/export-utils.ts` (dynamic import); jangan impor `jspdf`/`xlsx` langsung ke bundle client utama.

## 3. Larangan & Jebakan Spesifik

- Next 16 memakai **`proxy.ts`**, bukan `middleware.ts`. Jangan membuat `middleware.ts`. Rute publik baru harus didaftarkan di `isPublicRoute` pada `proxy.ts`.
- Driver **neon-http tidak mendukung interactive transaction**. Untuk operasi multi-statement atomik gunakan satu statement (mis. multi-row insert seperti `transferFunds`) atau `db.batch`. Jangan menulis `db.transaction(...)` tanpa mengganti driver terlebih dahulu.
- `lib/id-codec.ts` hanya obfuscation. **Jangan** dijadikan kontrol akses; otorisasi tetap lewat filter `userId`.
- Endpoint publik (`/api/webhooks/clerk`, `/api/cron/weekly-report`) harus tetap terverifikasi (signature svix / `CRON_SECRET`). Jangan melonggarkannya.
- `app/api/fix-db/route.ts` adalah endpoint DDL manual khusus development. Jangan diperluas atau diaktifkan di production.
- Menambah tabel yang menyimpan data user → **wajib** ikut ditambahkan ke penghapusan GDPR di `app/api/webhooks/clerk/route.ts`.
- Jangan mengubah `vendor/xlsx-0.20.3.tgz` atau override `pnpm` tanpa alasan keamanan yang jelas.
- Jangan menambah dependency baru tanpa justifikasi dan alternatif tanpa dependency.
- Gunakan `.gitignore` sebagai acuan: `.agents/`, `.codex/`, `ryan_workspace/`, `scratch/` tidak ikut repo.

## 4. Aturan Kerja Agent (peleburan dari `.instructions.md`)

1. **Analisis & Kritik** — mulai dengan evaluasi permintaan: konteks, edge-case, trade-off. Pertanyakan asumsi bila solusi terlalu kompleks atau stack belum jelas.
2. **Execution Plan dulu** — sebelum menulis kode, tampilkan langkah implementasi (perubahan file, alur logika, penanganan error). Jangan langsung memberi kode lengkap. Tunggu persetujuan eksplisit untuk perubahan yang menyentuh banyak file, kontrak publik, atau skema data.
3. **Eksekusi Kode** — hanya setelah plan; fokus pada perubahan yang diperlukan. Komentar menjelaskan *alasan* (WHY), bukan sintaks.
4. **Bahasa & gaya** — Indonesia; istilah teknis tetap Inggris (`API`, `query`, `schema`). Profesional, langsung, ringkas, tanpa basa-basi.
5. **Prinsip utama**
   - Zero hallucination: bila tidak yakin soal API/behavior, nyatakan ketidakpastian. Jangan mengarang path, fungsi, atau kolom; verifikasi lewat `ls`/`grep`/baca file.
   - Tidak over-engineering: pilih solusi paling sederhana yang memenuhi kebutuhan.
   - Robustness first: error handling, validasi input, fallback.
   - Maintainability: nama deskriptif, hindari magic number, minimalkan coupling.
6. Setiap saran teknis menyertakan trade-off dan minimal satu alternatif. Untuk debugging, jelaskan root cause, bukan hanya patch.
7. Setelah menulis kode, tinjau diri sendiri untuk Security (IDOR, injection, secret), Performance (N+1, query tanpa index/limit), dan Maintainability sebelum menyatakan selesai.

## 5. Checklist Sebelum Selesai

- [ ] Semua query terfilter `userId` dan resource referensi diverifikasi kepemilikannya.
- [ ] Input divalidasi Zod; error tidak membocorkan detail internal.
- [ ] Perubahan skema disertai migrasi Drizzle dan (bila perlu) update GDPR webhook.
- [ ] `revalidatePath` dipanggil untuk halaman yang terdampak.
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm build` dijalankan dan hasilnya dilaporkan jujur.
- [ ] `CONTEX.md` diperbarui bila arsitektur, tabel, atau alur kunci berubah.
