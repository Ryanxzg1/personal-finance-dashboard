"use client"

import { TrendingUp, TrendingDown, X } from "lucide-react"

interface TypeSelectorProps {
  open: boolean
  onClose: () => void
  onSelect: (type: "Pemasukan" | "Pengeluaran") => void
}

export function TypeSelector({ open, onClose, onSelect }: TypeSelectorProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/40 backdrop-blur-[2px]"
      />
      <div className="relative z-10 w-full max-w-sm rounded-sm border border-border bg-card p-6 shadow-xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-sans text-lg font-bold tracking-tight">Jenis Transaksi</h2>
          <button onClick={onClose} className="rounded-sm p-1 hover:bg-muted text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => onSelect("Pemasukan")}
            className="group flex flex-col items-center gap-3 rounded-sm border border-border bg-background p-5 transition-all hover:border-[#5a6b3b] hover:bg-[#5a6b3b]/5 hover:shadow-md active:scale-95"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#5a6b3b]/10 text-[#5a6b3b] group-hover:bg-[#5a6b3b] group-hover:text-white transition-colors">
              <TrendingUp className="h-6 w-6" />
            </div>
            <span className="font-sans text-sm font-bold uppercase tracking-wider text-muted-foreground group-hover:text-[#5a6b3b]">Pemasukan</span>
          </button>

          <button
            onClick={() => onSelect("Pengeluaran")}
            className="group flex flex-col items-center gap-3 rounded-sm border border-border bg-background p-5 transition-all hover:border-destructive hover:bg-destructive/5 hover:shadow-md active:scale-95"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive group-hover:bg-destructive group-hover:text-white transition-colors">
              <TrendingDown className="h-6 w-6" />
            </div>
            <span className="font-sans text-sm font-bold uppercase tracking-wider text-muted-foreground group-hover:text-destructive">Pengeluaran</span>
          </button>
        </div>

        <p className="mt-6 text-center font-serif text-[11px] italic text-muted-foreground">
          Pilih salah satu untuk melanjutkan pencatatan.
        </p>
      </div>
    </div>
  )
}
