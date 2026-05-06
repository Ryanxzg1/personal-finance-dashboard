"use client"

import { useMemo, useState } from "react"
import { Calendar, ChevronDown, NotebookPen, Pencil, Plus, Tag, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import dynamic from "next/dynamic"
import { motion, AnimatePresence } from "framer-motion"

const ExportButton = dynamic(() => import("../dashboard/export-button"), { ssr: false })

export type TxType = "Pemasukan" | "Pengeluaran"

export interface Transaction {
  id: string
  date: string // "15 Okt"
  rawDate: string // ISO Date String
  type: TxType
  category: string
  note: string
  amount: number
  accountId?: number | null
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

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
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
          <ExportButton 
            filteredData={filtered} 
            selectedMonthName={months[selectedMonth]} 
            selectedYear={selectedYear}
            disabled={isEmpty}
          />
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
        <>
          {/* Card View - Mobile Only */}
          <div className="flex flex-col lg:hidden divide-y divide-border/50">
            <AnimatePresence mode="popLayout">
            {filtered.map((tx) => {
              const isIncome = tx.amount >= 0
              return (
                <motion.div 
                  key={tx.id} 
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="p-4 flex flex-col gap-3 active:bg-muted/30 transition-colors"
                >
                  <div className="flex justify-between items-start">
                     <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{tx.date}</span>
                          <span className={cn("h-1 w-1 rounded-full bg-border")} />
                          <span className={cn("font-serif text-xs italic", isIncome ? "text-[#5a6b3b]" : "text-destructive")}>{tx.type}</span>
                        </div>
                        <span className={cn("inline-flex w-fit items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider", CATEGORY_STYLES[tx.category] ?? "border-border bg-secondary text-secondary-foreground")}>
                          {tx.category}
                        </span>
                     </div>
                     <div className="flex items-center gap-1">
                        <IconButton label="Edit" icon={Pencil} onClick={() => onEdit?.(tx)} />
                        <IconButton label="Hapus" icon={Trash2} tone="destructive" onClick={() => onDelete?.(tx.id)} />
                     </div>
                  </div>
                  <div className="flex justify-between items-end">
                     <span className="font-serif text-[13px] text-muted-foreground line-clamp-1 flex-1 mr-4">{tx.note}</span>
                     <span className={cn("font-mono text-base font-bold tabular-nums shrink-0", isIncome ? "text-[#5a6b3b]" : "text-destructive")}>
                       {formatRupiah(tx.amount)}
                     </span>
                  </div>
                </motion.div>
              )
            })}
            </AnimatePresence>
          </div>

          {/* Table View - Desktop Only */}
          <div className="hidden lg:block overflow-x-auto">
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
                <AnimatePresence mode="popLayout">
                {filtered.map((tx, idx) => {
                  const isIncome = tx.amount >= 0
                  return (
                    <motion.tr 
                      key={tx.id} 
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, backgroundColor: "rgba(239, 68, 68, 0.1)" }}
                      transition={{ duration: 0.2 }}
                      className="group border-b border-border/70 transition-colors hover:bg-muted/40"
                    >
                      <Td><span className="font-mono text-[13px] uppercase tracking-wider text-muted-foreground">{tx.date}</span></Td>
                      <Td><span className={cn("font-serif text-[15px] italic", isIncome ? "text-[#5a6b3b]" : "text-destructive")}>{tx.type}</span></Td>
                      <Td>
                        <div className="flex flex-col gap-1.5">
                          <span className={cn("inline-flex w-fit items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono text-[11px] font-medium uppercase tracking-wider", CATEGORY_STYLES[tx.category] ?? "border-border bg-secondary text-secondary-foreground")}>
                            <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                            {tx.category}
                          </span>
                          <span className="font-serif text-[13px] text-muted-foreground">{tx.note}</span>
                        </div>
                      </Td>
                      <Td className="text-right"><span className={cn("font-mono text-[15px] font-bold tabular-nums", isIncome ? "text-[#5a6b3b]" : "text-destructive")}>{formatRupiah(tx.amount)}</span></Td>
                      <Td className="text-right">
                        <div className="flex items-center justify-end gap-1 lg:opacity-60 transition-opacity lg:group-hover:opacity-100">
                          <IconButton label="Edit" icon={Pencil} onClick={() => onEdit?.(tx)} />
                          <IconButton label="Hapus" icon={Trash2} tone="destructive" onClick={() => onDelete?.(tx.id)} />
                        </div>
                      </Td>
                    </motion.tr>
                  )
                })}
              </AnimatePresence>
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={cn("px-4 lg:px-6 py-4 font-mono text-[13px] uppercase tracking-[0.15em] text-muted-foreground/80", className)}>{children}</th>
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-4 lg:px-6 py-4 align-top", className)}>{children}</td>
}

function IconButton({ label, icon: Icon, tone = "default", onClick }: { label: string; icon: any; tone?: string; onClick?: () => void }) {
  return (
    <button 
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }} 
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-sm transition-colors cursor-pointer", 
        tone === "destructive" ? "text-muted-foreground hover:bg-destructive/10 hover:text-destructive" : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  )
}

function FilterSelect({ icon: Icon, label, value, options, onChange }: { icon: any; label: string; value: string; options: { label: string; value: string }[]; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center gap-2 rounded-sm border border-border bg-background px-3 py-2 text-[13px] shadow-xs focus-within:border-primary/60 transition-colors cursor-pointer">
      <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      <select value={value} onChange={(e) => onChange(e.target.value)} className="appearance-none bg-transparent pr-4 font-serif text-foreground focus:outline-none">
        {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
      <ChevronDown className="-ml-4 h-4 w-4 text-muted-foreground pointer-events-none" />
    </label>
  )
}
