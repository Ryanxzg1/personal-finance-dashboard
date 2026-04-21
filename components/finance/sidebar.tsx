"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Tags, History, Plus, BookOpen, User } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Sidebar({ onNewEntry }: { onNewEntry?: () => void }) {
  const pathname = usePathname();
  
  const items = [
    { href: "/", label: "Beranda", icon: Home },
    { href: "/kategori", label: "Kategori", icon: Tags },
    { href: "/riwayat", label: "Riwayat", icon: History },
  ]

  return (
    <aside className="sticky top-0 flex h-[100dvh] w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      {/* Brand */}
      <div className="flex items-center gap-3 border-b border-sidebar-border px-6 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-sidebar-border bg-card">
          <BookOpen className="h-5 w-5 text-primary" aria-hidden="true" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="font-sans text-base font-bold tracking-tight">Buku Kas</span>
          <span className="font-serif text-xs italic text-muted-foreground">est. 2026</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5" aria-label="Navigasi utama">
        <p className="mb-2 px-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Menu
        </p>
        <ul className="flex flex-col gap-1">
          {items.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-sm border border-transparent px-3 py-2 text-left font-serif text-sm transition-colors",
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

        <Button
          type="button"
          onClick={onNewEntry}
          className="w-full justify-center gap-2 rounded-sm bg-primary font-sans text-sm font-bold tracking-wide text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Input Baru
        </Button>
      </nav>

      {/* Info Footer */}
      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 rounded-sm border border-sidebar-border bg-card p-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-secondary">
             <User className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Pencatatan Aktif</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
