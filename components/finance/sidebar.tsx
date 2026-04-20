"use client"

import { cn } from "@/lib/utils"
import { Home, Tags, History, Plus, LogOut, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"

type NavKey = "beranda" | "kategori" | "riwayat"

interface SidebarProps {
  active: NavKey
  onNavigate: (key: NavKey) => void
  onNewEntry: () => void
}

const items: { key: NavKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "beranda", label: "Beranda", icon: Home },
  { key: "kategori", label: "Kategori", icon: Tags },
  { key: "riwayat", label: "Riwayat", icon: History },
]

export function Sidebar({ active, onNavigate, onNewEntry }: SidebarProps) {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
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
          {items.map(({ key, label, icon: Icon }) => {
            const isActive = active === key
            return (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => onNavigate(key)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-sm border border-transparent px-3 py-2 text-left font-serif text-sm transition-colors",
                    isActive
                      ? "border-sidebar-border bg-card text-foreground shadow-xs"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span>{label}</span>
                </button>
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

      {/* User */}
      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 rounded-sm border border-sidebar-border bg-card p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-secondary font-sans text-sm font-bold text-secondary-foreground">
            AR
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-sans text-sm font-bold">Adhitya R.</p>
            <p className="truncate font-mono text-[11px] text-muted-foreground">adhitya@mail.id</p>
          </div>
        </div>
        <button
          type="button"
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-sm border border-sidebar-border bg-transparent px-3 py-2 font-serif text-sm text-muted-foreground transition-colors hover:border-destructive/40 hover:bg-card hover:text-destructive"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Logout
        </button>
      </div>
    </aside>
  )
}
