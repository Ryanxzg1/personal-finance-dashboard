"use client"

import { useMemo, useState, useOptimistic, useTransition } from "react"
import { SummarySection } from "@/components/finance/summary-section"
import { QuickInput } from "@/components/finance/quick-input"
import { ChartSection } from "@/components/finance/chart-section"
import {
  TransactionsTable,
  type Transaction as UITransaction,
} from "@/components/finance/transactions-table"
import { InputDialog, type InputMode } from "@/components/finance/input-dialog"
import { createTransaction, deleteTransaction, updateTransaction } from "@/lib/actions/transactions"
import { toast } from "sonner"
import { TrendingUp, TrendingDown, Wallet, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface Category {
  id: number
  name: string
  type: "income" | "expense"
  icon: string | null
}

interface Budget {
  categoryId: number
  limitAmount: string
}

interface DashboardClientProps {
  initialTransactions: UITransaction[]
  initialCategories: Category[]
  initialBudgets: Budget[]
  userName: string
}

type Action = 
  | { type: "ADD"; transaction: UITransaction }
  | { type: "DELETE"; id: string }
  | { type: "UPDATE"; transaction: UITransaction }

export function DashboardClient({ initialTransactions, initialCategories, initialBudgets, userName }: DashboardClientProps) {
  const [isPending, startTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<InputMode>("Pemasukan")
  const [editingTx, setEditingTx] = useState<UITransaction | null>(null)

  // --- OPTIMISTIC UI LOGIC ---
  const [optimisticTransactions, addOptimisticAction] = useOptimistic(
    initialTransactions,
    (state, action: Action) => {
      switch (action.type) {
        case "ADD": return [action.transaction, ...state]
        case "DELETE": return state.filter((t) => t.id !== action.id)
        case "UPDATE": return state.map((t) => (t.id === action.transaction.id ? action.transaction : t))
        default: return state
      }
    }
  )

  // --- STATISTICS & BUDGET CALCULATION ---
  const { stats, budgetProgress } = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const monthlyTxs = optimisticTransactions.filter(t => {
      const d = new Date(t.rawDate)
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear
    })

    const income = monthlyTxs.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0)
    const expense = monthlyTxs.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0)
    const balance = optimisticTransactions.reduce((sum, t) => sum + t.amount, 0)

    // Calculate progress for each category with a budget
    const progress = initialBudgets.map(budget => {
      const category = initialCategories.find(c => c.id === budget.categoryId)
      const spent = monthlyTxs.filter(t => t.category === category?.name && t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0)
      const limit = parseFloat(budget.limitAmount)
      const percentage = limit > 0 ? (spent / limit) * 100 : 0
      
      return {
        name: category?.name || "Unknown",
        icon: category?.icon || "📁",
        spent,
        limit,
        percentage
      }
    }).filter(b => b.limit > 0)

    return { stats: { income, expense, balance }, budgetProgress: progress }
  }, [optimisticTransactions, initialBudgets, initialCategories])

  const openAddDialog = (mode: InputMode) => {
    setEditingTx(null)
    setDialogMode(mode)
    setDialogOpen(true)
  }

  const openEditDialog = (tx: UITransaction) => {
    setEditingTx(tx)
    setDialogMode(tx.type === "Pemasukan" ? "Pemasukan" : "Pengeluaran")
    setDialogOpen(true)
  }

  const handleSubmit = async (data: { amount: number; category: string; note: string; date: string }) => {
    const d = new Date(data.date)
    const formattedDate = `${String(d.getDate()).padStart(2, "0")} ${d.toLocaleString("id-ID", { month: "short" })}`.replace(".", "")

    if (editingTx) {
      const updatedTxUI: UITransaction = {
        ...editingTx,
        date: formattedDate,
        rawDate: d.toISOString(),
        category: data.category,
        note: data.note,
        amount: data.amount,
      }
      startTransition(async () => {
        addOptimisticAction({ type: "UPDATE", transaction: updatedTxUI })
        const result = await updateTransaction(editingTx.id, {
           amount: data.amount.toString(),
           category: data.category,
           description: data.note,
           date: d,
           type: data.amount >= 0 ? "income" : "expense",
        })
        if (!result.success) toast.error("Gagal memperbarui data")
        else toast.success("Transaksi diperbarui")
      })
    } else {
      const newTxUI: UITransaction = {
        id: `temp-${Date.now()}`,
        date: formattedDate,
        rawDate: d.toISOString(),
        type: data.amount >= 0 ? "Pemasukan" : "Pengeluaran",
        category: data.category,
        note: data.note,
        amount: data.amount,
      }
      startTransition(async () => {
        addOptimisticAction({ type: "ADD", transaction: newTxUI })
        const result = await createTransaction({
          description: data.note,
          amount: data.amount.toString(),
          category: data.category,
          type: data.amount >= 0 ? "income" : "expense",
          date: d,
        })
        if (!result.success) toast.error("Gagal menyimpan data")
        else toast.success("Transaksi disimpan")
      })
    }
  }

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Saldo Total" amount={stats.balance} icon={Wallet} color="text-foreground" />
        <StatCard label="Masuk Bulan Ini" amount={stats.income} icon={TrendingUp} color="text-[#5a6b3b]" />
        <StatCard label="Keluar Bulan Ini" amount={stats.expense} icon={TrendingDown} color="text-destructive" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
           <ChartSection transactions={optimisticTransactions} />
           
           {/* Budget Progress Widget (BARU) */}
           {budgetProgress.length > 0 && (
             <div className="rounded-sm border border-border bg-card p-6 shadow-xs">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-sans text-sm font-bold uppercase tracking-wider text-foreground">Pantauan Anggaran</h3>
                  <div className="flex items-center gap-1 text-[10px] uppercase font-mono text-muted-foreground">
                    <AlertCircle className="h-3 w-3" />
                    Real-time
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  {budgetProgress.map((bp) => (
                    <div key={bp.name} className="space-y-2">
                       <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider">
                          <span className="flex items-center gap-2 text-foreground font-bold">
                            <span>{bp.icon}</span>
                            {bp.name}
                          </span>
                          <span className="text-muted-foreground">
                            Rp {bp.spent.toLocaleString("id-ID")} / Rp {bp.limit.toLocaleString("id-ID")}
                          </span>
                       </div>
                       <div className="h-2 w-full bg-muted rounded-full overflow-hidden border border-border/50">
                          <div 
                            className={cn(
                              "h-full transition-all duration-500",
                              bp.percentage > 100 ? "bg-destructive" : bp.percentage > 80 ? "bg-orange-500" : "bg-primary"
                            )}
                            style={{ width: `${Math.min(bp.percentage, 100)}%` }}
                          />
                       </div>
                    </div>
                  ))}
                </div>
             </div>
           )}
        </div>
        
        <QuickInput onIncome={() => openAddDialog("Pemasukan")} onExpense={() => openAddDialog("Pengeluaran")} />
      </div>

      <TransactionsTable
        transactions={optimisticTransactions}
        onDelete={(id) => startTransition(async () => {
          addOptimisticAction({ type: "DELETE", id })
          const result = await deleteTransaction(id)
          if (!result.success) toast.error("Gagal menghapus data")
          else toast.success("Transaksi dihapus")
        })}
        onEdit={openEditDialog}
        onNewEntry={() => openAddDialog("Pengeluaran")}
      />

      <InputDialog
        open={dialogOpen}
        mode={dialogMode}
        categories={initialCategories}
        initialData={editingTx || undefined}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  )
}

function StatCard({ label, amount, icon: Icon, color }: { label: string; amount: number; icon: any; color: string }) {
  return (
    <div className="rounded-sm border border-border bg-card p-5 shadow-xs">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className={cn("mt-1 font-mono text-xl font-bold tracking-tight", color)}>
            Rp {Math.abs(amount).toLocaleString("id-ID")}
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50">
          <Icon className={cn("h-5 w-5", color)} />
        </div>
      </div>
    </div>
  )
}
