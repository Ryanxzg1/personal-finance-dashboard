"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Tags, History, Plus, BookOpen, Target, Compass, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"

import { UserButton, useUser } from "@clerk/nextjs"

import { useRouter } from "next/navigation"

export function Sidebar({ onNewEntry }: { onNewEntry?: () => void }) {
  const pathname = usePathname();
  const { user } = useUser();
  const router = useRouter();
  
  const items = [
    { href: "/", label: "Beranda", icon: Home },
    { href: "/tabungan", label: "Tabungan", icon: Target },
    { href: "/pemetaan", label: "Pemetaan Biaya", icon: Compass },
    { href: "/kategori", label: "Kategori", icon: Tags },
    { href: "/riwayat", label: "Riwayat", icon: History },
  ]

  const handleNewEntry = () => {
    // Selalu arahkan ke dashboard dengan query param
    router.push("/?new=select");
    
    // Jika ada callback tambahan (misal untuk menutup mobile menu), jalankan
    if (onNewEntry) {
      onNewEntry();
    }
  };

  const handleTransfer = () => {
    // Selalu arahkan ke dashboard dengan query param transfer
    router.push("/?transfer=true");
    
    if (onNewEntry) {
      onNewEntry();
    }
  };

  return (
    <aside className="sticky top-0 flex h-[100dvh] w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      {/* Brand */}
      <div className="flex items-center gap-3 border-b border-sidebar-border px-6 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-sidebar-border bg-card">
          <BookOpen className="h-5 w-5 text-primary" aria-hidden="true" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="font-sans text-lg font-bold tracking-tight">Buku Keuangan</span>
          <span className="font-serif text-xs italic text-muted-foreground">est. 2026</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5" aria-label="Navigasi utama">
        <p className="mb-2 px-3 font-mono text-sm uppercase tracking-[0.18em] text-muted-foreground">
          Menu Utama
        </p>
        <ul className="flex flex-col gap-1">
          {items.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-sm border border-transparent px-3 py-2 text-left font-serif text-base transition-colors",
                    isActive
                      ? "border-sidebar-border bg-card text-foreground shadow-xs"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span>{label}</span>
                </Link>
              </li>
            )
          })}
        </ul>

        <div className="my-5 h-px bg-sidebar-border" aria-hidden="true" />

        <div className="px-3 flex flex-col gap-2">
          <Button
            type="button"
            onClick={handleNewEntry}
            className="w-full justify-center gap-2 rounded-sm bg-primary px-4 py-2.5 font-sans text-sm font-bold uppercase tracking-[0.1em] text-primary-foreground shadow-xs hover:bg-primary/90 transition-all active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Input Baru
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleTransfer}
            className="w-full justify-center gap-2 rounded-sm border-sidebar-border bg-sidebar-accent/40 px-4 py-2 font-sans text-xs font-bold uppercase tracking-[0.16em] text-foreground hover:bg-sidebar-accent hover:text-foreground transition-all active:scale-[0.98] shadow-xs"
          >
            <TrendingUp className="h-3.5 w-3.5 rotate-45 text-primary" aria-hidden="true" />
            Transfer Dana
          </Button>
        </div>
      </nav>

      {/* User Footer */}
      <div className="border-t border-sidebar-border p-4 bg-card/10">
        <div className="flex items-center gap-3 rounded-sm border border-sidebar-border bg-card p-2 shadow-xs transition-colors hover:bg-muted/30">
          <UserButton 
            appearance={{
              elements: {
                userButtonAvatarBox: "h-9 w-9 rounded-sm border-2 border-sidebar-border shadow-xs",
                userButtonTrigger: "focus:shadow-none focus:outline-none"
              }
            }}
          />
          <div className="min-w-0 flex-1 flex flex-col">
            <span className="truncate font-sans text-sm font-bold text-foreground">
              {user?.fullName || "Pengguna"}
            </span>
            <span className="truncate font-mono text-xs text-muted-foreground">
              {user?.primaryEmailAddress?.emailAddress || "Sign out"}
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}
