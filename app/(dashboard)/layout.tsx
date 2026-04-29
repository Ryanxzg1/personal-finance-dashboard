import { Sidebar } from "@/components/finance/sidebar";
import { currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { MobileMenu } from "@/components/finance/mobile-menu";
import { CommandMenu } from "@/components/finance/command-menu";
import { PageTitle } from "@/components/finance/page-title";

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
                  userButtonAvatarBox: "h-9 w-9 rounded-sm border-2 border-border shadow-xs",
                }
              }}
            />
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
