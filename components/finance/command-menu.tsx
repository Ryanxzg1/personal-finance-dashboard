"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Command } from "cmdk"
import { 
  Search, 
  History, 
  Tags, 
  Wallet, 
  TrendingUp, 
  ArrowRight,
  Calculator,
  LayoutDashboard,
  Compass
} from "lucide-react"
import { searchEverything } from "@/lib/actions/search"
import { cn } from "@/lib/utils"
import * as Dialog from "@radix-ui/react-dialog"

export function CommandMenu() {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<{
    transactions: any[]
    categories: any[]
    accounts: any[]
  }>({ transactions: [], categories: [], accounts: [] })
  const [isSearching, setIsSearching] = React.useState(false)
  const router = useRouter()

  // Toggle the menu when ⌘K is pressed
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  // Handle Search logic
  React.useEffect(() => {
    if (query.length < 2) {
      setResults({ transactions: [], categories: [], accounts: [] })
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      const res = await searchEverything(query)
      if (res.success && res.data) {
        setResults(res.data)
      }
      setIsSearching(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false)
    command()
  }, [])

  return (
    <>
      {/* Search Trigger Button in Header */}
      <button
        onClick={() => setOpen(true)}
        className="group flex h-9 w-40 lg:w-64 items-center gap-2 rounded-sm border border-border bg-muted/50 px-3 transition-colors hover:bg-muted"
      >
        <Search className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
        <span className="flex-1 text-left font-sans text-xs text-muted-foreground group-hover:text-foreground">
          Cari (Ctrl + K)
        </span>
      </button>

      <Command.Dialog
        open={open}
        onOpenChange={setOpen}
        label="Global Search"
        className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[10dvh]"
      >
        <div className="fixed inset-0 bg-foreground/40 backdrop-blur-[2px]" onClick={() => setOpen(false)} />
        
        <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-sm border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <Dialog.Title className="sr-only">Pencarian Global</Dialog.Title>
          <div className="flex items-center border-b border-dashed border-border px-4 py-3">
            <Search className="mr-3 h-4 w-4 shrink-0 text-muted-foreground" />
            <Command.Input
              autoFocus
              placeholder="Cari transaksi, kategori, atau akun..."
              className="flex-1 bg-transparent font-serif text-base outline-none placeholder:text-muted-foreground"
              value={query}
              onValueChange={setQuery}
            />
            {isSearching && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            )}
          </div>

          <Command.List className="max-h-[60vh] overflow-y-auto p-2 scrollbar-none">
            <Command.Empty className="py-10 text-center font-serif text-sm text-muted-foreground">
              {query.length < 2 ? "Ketik minimal 2 karakter..." : "Tidak ada hasil ditemukan."}
            </Command.Empty>

            {/* Quick Actions */}
            <Command.Group heading={<span className="px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Navigasi Cepat</span>}>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/"))}
                className="flex items-center gap-3 rounded-sm px-3 py-2 text-sm transition-colors hover:bg-muted cursor-pointer aria-selected:bg-muted"
              >
                <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                <span className="font-serif">Beranda Dashboard</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/riwayat"))}
                className="flex items-center gap-3 rounded-sm px-3 py-2 text-sm transition-colors hover:bg-muted cursor-pointer aria-selected:bg-muted"
              >
                <History className="h-4 w-4 text-muted-foreground" />
                <span className="font-serif">Riwayat Transaksi</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/kategori"))}
                className="flex items-center gap-3 rounded-sm px-3 py-2 text-sm transition-colors hover:bg-muted cursor-pointer aria-selected:bg-muted"
              >
                <Tags className="h-4 w-4 text-muted-foreground" />
                <span className="font-serif">Manajemen Kategori & Akun</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/tabungan"))}
                className="flex items-center gap-3 rounded-sm px-3 py-2 text-sm transition-colors hover:bg-muted cursor-pointer aria-selected:bg-muted"
              >
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="font-serif">Tabungan Berencana</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/pemetaan"))}
                className="flex items-center gap-3 rounded-sm px-3 py-2 text-sm transition-colors hover:bg-muted cursor-pointer aria-selected:bg-muted"
              >
                <Compass className="h-4 w-4 text-muted-foreground" />
                <span className="font-serif">Pemetaan Biaya</span>
              </Command.Item>
            </Command.Group>

            {/* Results: Transactions */}
            {results.transactions.length > 0 && (
              <Command.Group heading={<span className="px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-4 block">Transaksi Terkait</span>}>
                {results.transactions.map((tx) => (
                  <Command.Item
                    key={tx.id}
                    onSelect={() => runCommand(() => router.push("/riwayat"))}
                    className="flex items-center justify-between rounded-sm px-3 py-2 text-sm transition-colors hover:bg-muted cursor-pointer aria-selected:bg-muted"
                  >
                    <div className="flex items-center gap-3">
                      <History className="h-4 w-4 text-muted-foreground" />
                      <div className="flex flex-col">
                        <span className="font-serif font-bold">{tx.description}</span>
                        <span className="font-mono text-[10px] text-muted-foreground uppercase">{tx.category}</span>
                      </div>
                    </div>
                    <span className={cn(
                      "font-mono font-bold",
                      tx.type === "income" ? "text-[#5a6b3b]" : "text-destructive"
                    )}>
                      {tx.type === "income" ? "+" : "-"}Rp {parseFloat(tx.amount).toLocaleString("id-ID")}
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Results: Categories */}
            {results.categories.length > 0 && (
              <Command.Group heading={<span className="px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-4 block">Kategori</span>}>
                {results.categories.map((cat) => (
                  <Command.Item
                    key={cat.id}
                    onSelect={() => runCommand(() => router.push("/kategori"))}
                    className="flex items-center gap-3 rounded-sm px-3 py-2 text-sm transition-colors hover:bg-muted cursor-pointer aria-selected:bg-muted"
                  >
                    <Tags className="h-4 w-4 text-muted-foreground" />
                    <span className="font-serif">{cat.name}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Results: Accounts */}
            {results.accounts.length > 0 && (
              <Command.Group heading={<span className="px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-4 block">Akun & Dompet</span>}>
                {results.accounts.map((acc) => (
                  <Command.Item
                    key={acc.id}
                    onSelect={() => runCommand(() => router.push("/kategori"))}
                    className="flex items-center gap-3 rounded-sm px-3 py-2 text-sm transition-colors hover:bg-muted cursor-pointer aria-selected:bg-muted"
                  >
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                    <span className="font-serif">{acc.name}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>

          <div className="border-t border-dashed border-border bg-muted/30 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-1">
                 <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] border border-border shadow-xs">↵</kbd>
                 <span className="font-serif text-[10px] text-muted-foreground">Buka</span>
               </div>
               <div className="flex items-center gap-1">
                 <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] border border-border shadow-xs">ESC</kbd>
                 <span className="font-serif text-[10px] text-muted-foreground">Tutup</span>
               </div>
            </div>
            <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest italic">Global Search Engine</p>
          </div>
        </div>
      </Command.Dialog>
    </>
  )
}
