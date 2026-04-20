"use client"

import { useCallback, useMemo, useState } from "react"
import { Sidebar } from "@/components/finance/sidebar"
import { SummarySection } from "@/components/finance/summary-section"
import { QuickInput } from "@/components/finance/quick-input"
import {
  TransactionsTable,
  type Transaction,
} from "@/components/finance/transactions-table"
import { InputDialog, type InputMode } from "@/components/finance/input-dialog"

type NavKey = "beranda" | "kategori" | "riwayat"

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: "t1",
    date: "15 Okt",
    type: "Pemasukan",
    category: "Gaji",
    note: "Gaji Bulanan Oktober",
    amount: 5_000_000,
  },
  {
    id: "t2",
    date: "14 Okt",
    type: "Pengeluaran",
    category: "Makan",
    note: "Makan siang & kopi",
    amount: -85_000,
  },
  {
    id: "t3",
    date: "12 Okt",
    type: "Pengeluaran",
    category: "Belanja",
    note: "Belanja Bulanan",
    amount: -1_200_000,
  },
  {
    id: "t4",
    date: "10 Okt",
    type: "Pengeluaran",
    category: "Transport",
    note: "Isi bensin & tol",
    amount: -250_000,
  },
  {
    id: "t5",
    date: "08 Okt",
    type: "Pemasukan",
    category: "Freelance",
    note: "Proyek desain brosur",
    amount: 1_500_000,
  },
  {
    id: "t6",
    date: "05 Okt",
    type: "Pengeluaran",
    category: "Tagihan",
    note: "Listrik & internet",
    amount: -620_000,
  },
]

export default function Page() {
  const [active, setActive] = useState<NavKey>("beranda")
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<InputMode>("Pemasukan")

  const openDialog = useCallback((mode: InputMode) => {
    setDialogMode(mode)
    setDialogOpen(true)
  }, [])

  const balance = useMemo(
    () => transactions.reduce((sum, t) => sum + t.amount, 0),
    [transactions],
  )

  const lastEntries = useMemo(
    () =>
      transactions.slice(0, 3).map((t) => ({
        amount: t.amount,
        label: `${t.type} · ${t.note}`,
        date: t.date,
      })),
    [transactions],
  )

  const handleSubmit = (data: {
    amount: number
    category: string
    note: string
    date: string
  }) => {
    const d = new Date(data.date)
    const formatted = `${String(d.getDate()).padStart(2, "0")} ${d.toLocaleString("id-ID", {
      month: "short",
    })}`
    const newTx: Transaction = {
      id: `t${Date.now()}`,
      date: formatted.replace(".", ""),
      type: data.amount >= 0 ? "Pemasukan" : "Pengeluaran",
      category: data.category,
      note: data.note,
      amount: data.amount,
    }
    setTransactions((prev) => [newTx, ...prev])
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar
        active={active}
        onNavigate={setActive}
        onNewEntry={() => openDialog("Pengeluaran")}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="flex items-center justify-between border-b border-border bg-card/60 px-8 py-5">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Dasbor · {active === "beranda" ? "Beranda" : active === "kategori" ? "Kategori" : "Riwayat"}
            </p>
            <h1 className="mt-1 font-sans text-2xl font-bold tracking-tight text-foreground">
              Selamat pagi, Adhitya.
            </h1>
            <p className="mt-1 font-serif text-sm italic text-muted-foreground">
              Hari ini Jumat, 17 Oktober 2026 — mari jaga catatan tetap rapi.
            </p>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <div className="flex flex-col items-end border-r border-border pr-4">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Saldo
              </span>
              <span className="font-mono text-sm font-medium tabular-nums text-foreground">
                Rp {balance.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Transaksi
              </span>
              <span className="font-mono text-sm font-medium tabular-nums text-foreground">
                {transactions.length} entri
              </span>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 space-y-6 p-6 lg:p-8">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
            <SummarySection balance={balance} changePct={4.2} lastEntries={lastEntries} />
            <QuickInput
              onIncome={() => openDialog("Pemasukan")}
              onExpense={() => openDialog("Pengeluaran")}
            />
          </div>

          <TransactionsTable
            transactions={transactions}
            onNewEntry={() => openDialog("Pengeluaran")}
          />

          <footer className="flex flex-col items-center justify-between gap-2 border-t border-dashed border-border pt-4 md:flex-row">
            <p className="font-serif text-xs italic text-muted-foreground">
              &ldquo;Uang yang dicatat dengan rapi adalah uang yang dijaga dengan baik.&rdquo;
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Buku Kas · v1.0 · dibuat dengan hati
            </p>
          </footer>
        </div>
      </main>

      <InputDialog
        open={dialogOpen}
        mode={dialogMode}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
