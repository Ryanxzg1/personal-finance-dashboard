"use client"

import { useMemo, useState } from "react"
import { Calendar, ChevronDown, NotebookPen, Pencil, Plus, Tag, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

export type TxType = "Pemasukan" | "Pengeluaran"

export interface Transaction {
  id: string
  date: string // "15 Okt"
  type: TxType
  category: string
  note: string
  amount: number // positive = income, negative = expense
}

interface TransactionsTableProps {
  transactions: Transaction[]
  onNewEntry: () => void
}

const CATEGORY_STYLES: Record<string, string> = {
  Gaji: "border-[#5a6b3b]/30 bg-[#5a6b3b]/10 text-[#5a6b3b]",
  Bonus: "border-[#8a6b3b]/30 bg-[#8a6b3b]/10 text-[#8a6b3b]",
  Freelance: "border-[#4d6b74]/30 bg-[#4d6b74]/10 text-[#4d6b74]",
  Makan: "border-destructive/30 bg-destructive/10 text-destructive",
  Transport: "border-primary/30 bg-primary/10 text-primary",
  Belanja: "border-[#8a4a35]/30 bg-[#8a4a35]/10 text-[#8a4a35]",
  Tagihan: "border-[#6b4a35]/30 bg-[#6b4a35]/10 text-[#6b4a35]",
  Hiburan: "border-[#7d5a3a]/30 bg-[#7d5a3a]/10 text-[#7d5a3a]",
}

function formatRupiah(value: number) {
  const sign = value < 0 ? "−" : "+"
  const abs = Math.abs(value).toLocaleString("id-ID")
  return `${sign} Rp ${abs}`
}

export function TransactionsTable({ transactions, onNewEntry }: TransactionsTableProps) {
  const [dateRange, setDateRange] = useState("Oktober 2026")
  const [category, setCategory] = useState("Semua Kategori")

  const allCategories = useMemo(() => {
    const set = new Set<string>()
    transactions.forEach((t) => set.add(t.category))
    return ["Semua Kategori", ...Array.from(set)]
  }, [transactions])

  const filtered = useMemo(() => {
    if (category === "Semua Kategori") return transactions
    return transactions.filter((t) => t.category === category)
  }, [transactions, category])

  const isEmpty = filtered.length === 0

  return (
    <section
      aria-labelledby="aktivitas-heading"
      className="rounded-sm border border-border bg-card shadow-xs"
    >
      {/* Header + filters */}
      <div className="flex flex-col gap-4 border-b border-border px-6 py-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2
            id="aktivitas-heading"
            className="font-sans text-xl font-bold tracking-tight text-foreground"
          >
            Aktivitas Terakhir
          </h2>
          <p className="mt-1 font-serif text-sm italic text-muted-foreground">
            Daftar Transaksi — disusun dari yang terbaru
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect
            icon={Calendar}
            label="Rentang Tanggal"
            value={dateRange}
            options={["Minggu Ini", "Oktober 2026", "September 2026", "Tahun 2026"]}
            onChange={setDateRange}
          />
          <FilterSelect
            icon={Tag}
            label="Kategori"
            value={category}
            options={allCategories}
            onChange={setCategory}
          />
        </div>
      </div>

      {/* Body */}
      {isEmpty ? (
        <EmptyState onNewEntry={onNewEntry} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left">
                <Th>Tanggal</Th>
                <Th>Jenis</Th>
                <Th>Kategori</Th>
                <Th className="text-right">Jumlah</Th>
                <Th className="w-24 text-right">Aksi</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tx, idx) => {
                const isIncome = tx.amount >= 0
                return (
                  <tr
                    key={tx.id}
                    className={cn(
                      "group border-b border-border/70 transition-colors hover:bg-muted/40",
                      idx === filtered.length - 1 && "border-b-0",
                    )}
                  >
                    <Td>
                      <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                        {tx.date}
                      </span>
                    </Td>
                    <Td>
                      <span
                        className={cn(
                          "font-serif text-sm italic",
                          isIncome ? "text-[#5a6b3b]" : "text-destructive",
                        )}
                      >
                        {tx.type}
                      </span>
                    </Td>
                    <Td>
                      <div className="flex flex-col gap-1">
                        <span
                          className={cn(
                            "inline-flex w-fit items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider",
                            CATEGORY_STYLES[tx.category] ??
                              "border-border bg-secondary text-secondary-foreground",
                          )}
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full bg-current"
                            aria-hidden="true"
                          />
                          {tx.category}
                        </span>
                        <span className="font-serif text-xs text-muted-foreground">{tx.note}</span>
                      </div>
                    </Td>
                    <Td className="text-right">
                      <span
                        className={cn(
                          "font-mono text-sm font-medium tabular-nums",
                          isIncome ? "text-[#5a6b3b]" : "text-destructive",
                        )}
                      >
                        {formatRupiah(tx.amount)}
                      </span>
                    </Td>
                    <Td className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                        <IconButton label="Edit transaksi" icon={Pencil} />
                        <IconButton label="Hapus transaksi" icon={Trash2} tone="destructive" />
                      </div>
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      {!isEmpty && (
        <div className="flex items-center justify-between border-t border-border px-6 py-3">
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Menampilkan {filtered.length} dari {transactions.length} entri
          </p>
          <button
            type="button"
            className="font-serif text-xs italic text-primary underline-offset-4 hover:underline"
          >
            Lihat semua riwayat →
          </button>
        </div>
      )}
    </section>
  )
}

/* ---------- Small building blocks ---------- */

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={cn(
        "px-6 py-3 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground",
        className,
      )}
    >
      {children}
    </th>
  )
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-6 py-4 align-top", className)}>{children}</td>
}

function IconButton({
  label,
  icon: Icon,
  tone = "default",
}: {
  label: string
  icon: React.ComponentType<{ className?: string }>
  tone?: "default" | "destructive"
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-sm border border-transparent transition-colors",
        tone === "destructive"
          ? "text-muted-foreground hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
          : "text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
  )
}

function FilterSelect({
  icon: Icon,
  label,
  value,
  options,
  onChange,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  options: string[]
  onChange: (v: string) => void
}) {
  return (
    <label className="flex items-center gap-2 rounded-sm border border-border bg-background px-3 py-2 text-sm shadow-xs transition-colors focus-within:border-primary/60">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-transparent pr-5 font-serif text-xs text-foreground focus:outline-none"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <ChevronDown className="-ml-4 h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
    </label>
  )
}

function EmptyState({ onNewEntry }: { onNewEntry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-border bg-muted/40">
        <NotebookPen className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="max-w-sm">
        <h3 className="font-sans text-base font-bold text-foreground">Belum ada transaksi</h3>
        <p className="mt-1 font-serif text-sm italic leading-relaxed text-muted-foreground">
          Mulai catat pemasukan atau pengeluaran pertamamu agar buku kas ini terisi rapi.
        </p>
      </div>
      <button
        type="button"
        onClick={onNewEntry}
        className="inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-2 font-sans text-sm font-bold text-primary-foreground shadow-xs hover:bg-primary/90"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        Buat Entri Pertama
      </button>
    </div>
  )
}
