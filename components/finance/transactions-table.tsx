"use client"

import { useMemo, useState } from "react"
import { Calendar, ChevronDown, NotebookPen, Pencil, Plus, Tag, Trash2, Download } from "lucide-react"
import { cn } from "@/lib/utils"

export type TxType = "Pemasukan" | "Pengeluaran"

export interface Transaction {
  id: string
  date: string // "15 Okt"
  rawDate: string // ISO Date String
  type: TxType
  category: string
  note: string
  amount: number
}

interface TransactionsTableProps {
  transactions: Transaction[]
  onNewEntry?: () => void
  onDelete?: (id: string) => void
  onEdit?: (tx: Transaction) => void
}

const CATEGORY_STYLES: Record<string, string> = {
  Gaji: "border-[#5a6b3b]/30 bg-[#5a6b3b]/10 text-[#5a6b3b]",
  Bonus: "border-[#8a6b3b]/30 bg-[#8a6b3b]/10 text-[#8a6b3b]",
  Makan: "border-destructive/30 bg-destructive/10 text-destructive",
  Transport: "border-primary/30 bg-primary/10 text-primary",
  Belanja: "border-[#8a4a35]/30 bg-[#8a4a35]/10 text-[#8a4a35]",
}

function formatRupiah(value: number) {
  const sign = value < 0 ? "−" : "+"
  const abs = Math.abs(value).toLocaleString("id-ID")
  return `${sign} Rp ${abs}`
}

export function TransactionsTable({ transactions, onNewEntry, onDelete, onEdit }: TransactionsTableProps) {
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear())
  const [category, setCategory] = useState("Semua Kategori")

  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
  const years = [2024, 2025, 2026]

  const allCategories = useMemo(() => {
    const set = new Set<string>()
    transactions.forEach((t) => set.add(t.category))
    return ["Semua Kategori", ...Array.from(set)]
  }, [transactions])

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const d = new Date(t.rawDate)
      const matchMonth = d.getMonth() === selectedMonth
      const matchYear = d.getFullYear() === selectedYear
      const matchCat = category === "Semua Kategori" || t.category === category
      return matchMonth && matchYear && matchCat
    })
  }, [transactions, selectedMonth, selectedYear, category])

  const handleExport = () => {
    if (filtered.length === 0) return
    const headers = ["Tanggal", "Jenis", "Kategori", "Catatan", "Jumlah"]
    const rows = filtered.map(t => [t.date, t.type, t.category, t.note, t.amount])
    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n")
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `buku-kas-${months[selectedMonth]}-${selectedYear}.csv`)
    link.click()
  }

  const isEmpty = filtered.length === 0

  return (
    <section className="rounded-sm border border-border bg-card shadow-xs">
      <div className="flex flex-col gap-4 border-b border-border px-6 py-5 lg:flex-row lg:items-end lg:justify-between font-sans">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Aktivitas Keuangan</h2>
          <p className="mt-1 font-serif text-sm italic text-muted-foreground">
            {months[selectedMonth]} {selectedYear}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
           <FilterSelect
            icon={Calendar}
            label="Bulan"
            value={selectedMonth.toString()}
            onChange={(v) => setSelectedMonth(parseInt(v))}
            options={months.map((m, i) => ({ label: m, value: i.toString() }))}
          />
          <FilterSelect
            icon={Tag}
            label="Kategori"
            value={category}
            onChange={setCategory}
            options={allCategories.map(c => ({ label: c, value: c }))}
          />
          <button
            onClick={handleExport}
            className="flex h-9 items-center gap-2 rounded-sm border border-border bg-background px-3 font-serif text-xs text-muted-foreground hover:bg-muted transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Ekspor
          </button>
        </div>
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
            <NotebookPen className="h-8 w-8 text-muted-foreground/30" />
            <p className="font-serif text-sm italic text-muted-foreground text-balance max-w-xs">
                Tidak ada catatan transaksi untuk periode ini.
            </p>
        </div>
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
                  <tr key={tx.id} className="group border-b border-border/70 transition-colors hover:bg-muted/40">
                    <Td><span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{tx.date}</span></Td>
                    <Td><span className={cn("font-serif text-sm italic", isIncome ? "text-[#5a6b3b]" : "text-destructive")}>{tx.type}</span></Td>
                    <Td>
                      <div className="flex flex-col gap-1">
                        <span className={cn("inline-flex w-fit items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider", CATEGORY_STYLES[tx.category] ?? "border-border bg-secondary text-secondary-foreground")}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                          {tx.category}
                        </span>
                        <span className="font-serif text-xs text-muted-foreground">{tx.note}</span>
                      </div>
                    </Td>
                    <Td className="text-right"><span className={cn("font-mono text-sm font-medium tabular-nums", isIncome ? "text-[#5a6b3b]" : "text-destructive")}>{formatRupiah(tx.amount)}</span></Td>
                    <Td className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                        <IconButton label="Edit" icon={Pencil} onClick={() => onEdit?.(tx)} />
                        <IconButton label="Hapus" icon={Trash2} tone="destructive" onClick={() => onDelete?.(tx.id)} />
                      </div>
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={cn("px-6 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground", className)}>{children}</th>
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-6 py-4 align-top", className)}>{children}</td>
}

function IconButton({ label, icon: Icon, tone = "default", onClick }: { label: string; icon: any; tone?: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={cn("flex h-7 w-7 items-center justify-center rounded-sm transition-colors", tone === "destructive" ? "text-muted-foreground hover:bg-destructive/10 hover:text-destructive" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
      <Icon className="h-3.5 w-3.5" />
    </button>
  )
}

function FilterSelect({ icon: Icon, label, value, options, onChange }: { icon: any; label: string; value: string; options: { label: string; value: string }[]; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center gap-2 rounded-sm border border-border bg-background px-3 py-1.5 text-xs shadow-xs focus-within:border-primary/60 transition-colors cursor-pointer">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
      <select value={value} onChange={(e) => onChange(e.target.value)} className="appearance-none bg-transparent pr-4 font-serif text-foreground focus:outline-none">
        {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
      <ChevronDown className="-ml-4 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
    </label>
  )
}
