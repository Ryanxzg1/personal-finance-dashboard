import { Sidebar } from "@/components/finance/sidebar";
import { currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  const userName = user?.firstName || "Pengguna";

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar - Kita akan buat ini otomatis mendeteksi path nanti */}
      <Sidebar />

      <main className="flex min-w-0 flex-1 flex-col">
        {/* Header Global */}
        <header className="flex items-center justify-between border-b border-border bg-card/60 px-8 py-5">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Buku Kas · Sistem Pencatatan Digital
            </p>
            <h1 className="mt-1 font-sans text-2xl font-bold tracking-tight text-foreground">
              Selamat datang, {userName}.
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <UserButton />
          </div>
        </header>

        {/* Isi Halaman */}
        <div className="flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
