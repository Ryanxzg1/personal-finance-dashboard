"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Target, Tags, History, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()

  const navItems = [
    { href: "/", label: "Beranda", icon: Home },
    { href: "/tabungan", label: "Tabungan", icon: Target },
    { href: "/new", label: "Input", icon: Plus, isAction: true },
    { href: "/kategori", label: "Kategori", icon: Tags },
    { href: "/riwayat", label: "Riwayat", icon: History },
  ]

  const handleAction = (e: React.MouseEvent) => {
    e.preventDefault()
    router.push("/?new=select")
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-border bg-card/80 px-2 py-3 backdrop-blur-md lg:hidden">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href
        
        if (item.isAction) {
          return (
            <button
              key={item.label}
              onClick={handleAction}
              className="flex flex-col items-center justify-center gap-1 -mt-8"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg active:scale-90 transition-transform">
                <Plus className="h-6 w-6" />
              </div>
              <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground mt-1">
                {item.label}
              </span>
            </button>
          )
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 px-3 transition-colors",
              isActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
            <span className={cn(
              "font-mono text-[9px] uppercase tracking-wider",
              isActive ? "font-bold" : "font-normal"
            )}>
              {item.label}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
