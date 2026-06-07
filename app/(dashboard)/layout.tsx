import { Sidebar } from "@components/finance/layout/sidebar";
import { currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { MobileMenu } from "@components/finance/layout/mobile-menu";
import { CommandMenu } from "@components/finance/layout/command-menu";
import { PageTitle } from "@components/finance/layout/page-title";
import { BottomNav } from "@components/finance/layout/bottom-nav";

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

            <PageTitle userName={userName} />
          </div>
          <div className="flex items-center gap-3 lg:gap-6">
            <div className="hidden sm:block">
              <CommandMenu />
            </div>
            <UserButton 
              appearance={{
                elements: {
                  userButtonAvatarBox: "h-10 w-10 rounded-sm border-2 border-border shadow-xs",
                }
              }}
            />
          </div>
        </header>

        {/* Isi Halaman */}
        <div className="flex-1 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0">
          {children}
        </div>

        {/* Mobile Navigation */}
        <BottomNav />
      </main>
    </div>
  );
}
