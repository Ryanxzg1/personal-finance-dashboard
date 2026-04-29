"use client"

import { ArrowDownLeft, ArrowUpRight, Zap } from "lucide-react"

interface QuickInputProps {
  onIncome: () => void
  onExpense: () => void
}

export function QuickInput({ onIncome, onExpense }: QuickInputProps) {
  return (
    <aside
      aria-labelledby="input-cepat-heading"
      className="flex h-full flex-col rounded-sm border border-border bg-card p-5 shadow-xs"
    >
      <header className="flex items-center justify-between border-b border-dashed border-border pb-3">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" aria-hidden="true" />
          <h2
            id="input-cepat-heading"
            className="font-sans text-sm font-bold uppercase tracking-[0.14em] text-foreground"
          >
            Input Cepat
          </h2>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Pintasan
        </span>
      </header>

      <p className="mt-3 font-serif text-sm italic leading-relaxed text-muted-foreground">
        Catat transaksi dalam hitungan detik. Pilih jenis entri di bawah ini.
      </p>

      <div className="mt-5 flex flex-1 flex-col gap-3">
        <button
          type="button"
          onClick={onIncome}
          className="group flex items-center justify-between rounded-sm border border-[#5a6b3b]/30 bg-[#5a6b3b] px-4 py-4 text-left text-white shadow-xs transition-transform hover:-translate-y-0.5 hover:bg-[#4d5c32] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5a6b3b]"
        >
          <div className="flex flex-col">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/70">
              + Tambah
            </span>
            <span className="font-sans text-base font-bold tracking-tight">Input Pemasukan</span>
          </div>
          <ArrowUpRight
            className="h-5 w-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            aria-hidden="true"
          />
        </button>

        <button
          type="button"
          onClick={onExpense}
          className="group flex items-center justify-between rounded-sm border border-destructive/40 bg-destructive px-4 py-4 text-left text-destructive-foreground shadow-xs transition-transform hover:-translate-y-0.5 hover:bg-destructive/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destructive"
        >
          <div className="flex flex-col">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/70">
              − Kurangi
            </span>
            <span className="font-sans text-base font-bold tracking-tight">Input Pengeluaran</span>
          </div>
          <ArrowDownLeft
            className="h-5 w-5 transition-transform group-hover:-translate-x-0.5 group-hover:translate-y-0.5"
            aria-hidden="true"
          />
        </button>
      </div>

      <footer className="mt-5 border-t border-dashed border-border pt-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          Tip · Tekan{" "}
          <kbd className="rounded-sm border border-border bg-background px-1.5 py-0.5 font-mono text-[10px]">
            N
          </kbd>{" "}
          untuk entri baru
        </p>
      </footer>
    </aside>
  )
}
