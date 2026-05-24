import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <Link href="/" className="text-sm text-muted-foreground hover:text-foreground mb-8 inline-block">
        ← Kembali ke Beranda
      </Link>
      
      <h1 className="text-3xl font-serif font-bold mb-6">Syarat dan Ketentuan</h1>
      
      <div className="prose prose-sm md:prose-base dark:prose-invert space-y-6 text-muted-foreground leading-relaxed">
        <p>
          Terakhir diperbarui: 24 Mei 2026
        </p>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">1. Penerimaan Ketentuan</h2>
          <p>
            Dengan mengakses dan menggunakan Buku Kas, Anda menyetujui untuk terikat oleh syarat dan ketentuan ini. Jika Anda tidak setuju, harap jangan gunakan layanan kami.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">2. Penggunaan Layanan</h2>
          <p>
            Anda bertanggung jawab atas keamanan akun Anda dan semua aktivitas yang terjadi di bawah akun tersebut. Anda setuju untuk memberikan informasi yang akurat dan lengkap.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">3. Pembatasan Tanggung Jawab</h2>
          <p>
            Buku Kas disediakan "apa adanya" tanpa jaminan apa pun. Kami tidak bertanggung jawab atas kerugian finansial atau kehilangan data yang mungkin terjadi akibat penggunaan layanan ini. Selalu lakukan backup data Anda secara mandiri jika diperlukan.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">4. Modifikasi Layanan</h2>
          <p>
            Kami berhak untuk mengubah atau menghentikan layanan Buku Kas kapan saja tanpa pemberitahuan sebelumnya. Kami juga dapat memperbarui syarat dan ketentuan ini dari waktu ke waktu.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">5. Hukum yang Berlaku</h2>
          <p>
            Syarat dan ketentuan ini diatur oleh dan ditafsirkan sesuai dengan hukum yang berlaku di negara tempat layanan ini dioperasikan.
          </p>
        </section>
      </div>
    </div>
  );
}
