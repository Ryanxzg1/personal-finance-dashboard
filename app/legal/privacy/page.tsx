import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <Link href="/" className="text-sm text-muted-foreground hover:text-foreground mb-8 inline-block">
        ← Kembali ke Beranda
      </Link>
      
      <h1 className="text-3xl font-serif font-bold mb-6">Kebijakan Privasi</h1>
      
      <div className="prose prose-sm md:prose-base dark:prose-invert space-y-6 text-muted-foreground leading-relaxed">
        <p>
          Terakhir diperbarui: 24 Mei 2026
        </p>
        
        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">1. Informasi yang Kami Kumpulkan</h2>
          <p>
            Buku Kas mengumpulkan informasi yang Anda berikan secara langsung saat mendaftar dan menggunakan layanan kami, termasuk namun tidak terbatas pada nama, alamat email, dan data transaksi keuangan yang Anda masukkan.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">2. Penggunaan Informasi</h2>
          <p>
            Kami menggunakan informasi Anda untuk menyediakan, memelihara, dan meningkatkan layanan Buku Kas, serta untuk mengirimkan laporan mingguan jika Anda mengaktifkan fitur tersebut.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">3. Keamanan Data</h2>
          <p>
            Kami menggunakan standar keamanan industri untuk melindungi data Anda. Data keuangan Anda disimpan secara aman menggunakan database PostgreSQL terenkripsi dan autentikasi dikelola oleh Clerk.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">4. Hak Pengguna (GDPR)</h2>
          <p>
            Sesuai dengan regulasi perlindungan data, Anda memiliki hak untuk mengakses, memperbaiki, atau menghapus data Anda kapan saja melalui pengaturan akun. Jika Anda menghapus akun Buku Kas, seluruh data transaksi terkait akan dihapus secara permanen dari server kami.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">5. Hubungi Kami</h2>
          <p>
            Jika Anda memiliki pertanyaan tentang kebijakan privasi ini, silakan hubungi tim kami melalui saluran dukungan yang tersedia.
          </p>
        </section>
      </div>
    </div>
  );
}
