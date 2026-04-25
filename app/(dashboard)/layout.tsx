import { Sidebar } from "@/components/finance/sidebar";
import { currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { MobileMenu } from "@/components/finance/mobile-menu";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  const userName = user?.firstName || "Pengguna";

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar - Desktop Only */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <main className="flex min-w-0 flex-1 flex-col">
        {/* Header Global */}
        <header className="flex items-center justify-between border-b border-border bg-card/60 px-4 py-4 lg:px-8 lg:py-5">
          <div className="flex items-center gap-4">
            <MobileMenu />

            <div>
              <p className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:block lg:text-[13px]">
                Buku Kas · Sistem Pencatatan Digital
              </p>
              <h1 className="font-sans text-xl font-bold tracking-tight text-foreground lg:mt-1 lg:text-3xl">
                Selamat datang, {userName}.
              </h1>
            </div>
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
