"use client"

import { useMemo, useState, useOptimistic, useTransition, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { SummarySection } from "@/components/finance/summary-section"
import { ChartSection } from "@/components/finance/chart-section"
import {
  TransactionsTable,
  type Transaction as UITransaction,
} from "@/components/finance/transactions-table"
import { InputDialog, type InputMode } from "@/components/finance/input-dialog"
import { createTransaction, deleteTransaction, updateTransaction } from "@/lib/actions/transactions"
import { updateAccount } from "@/lib/actions/accounts"
import { toast } from "sonner"
import { TrendingUp, TrendingDown, Wallet, AlertCircle, Bell, BellOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { TypeSelector } from "@/components/finance/type-selector"
import { CategoryDistribution } from "@/components/finance/category-distribution"
import { AccountSummary } from "@/components/finance/account-summary"
import { AccountDialog } from "@/components/finance/account-dialog"
import { requestNotificationPermission, sendNotification, registerServiceWorker } from "@/lib/notifications"

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

interface Account {
  id: number
  name: string
  type: string
  initialBalance: string
}

interface DashboardClientProps {
  initialTransactions: UITransaction[]
  initialCategories: Category[]
  initialBudgets: Budget[]
  initialAccounts: Account[]
  userName: string
}

type Action = 
  | { type: "ADD"; transaction: UITransaction }
  | { type: "DELETE"; id: string }
  | { type: "UPDATE"; transaction: UITransaction }

export function DashboardClient({ 
  initialTransactions, 
  initialCategories, 
  initialBudgets, 
  initialAccounts,
  userName 
}: DashboardClientProps) {
  const [isPending, startTransition] = useTransition()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectorOpen, setSelectorOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<InputMode>("Pemasukan")
  const [editingTx, setEditingTx] = useState<UITransaction | null>(null)
  const [editingAccount, setEditingAccount] = useState<any | null>(null)
  const [accountDialogOpen, setAccountDialogOpen] = useState(false)
  const [notifGranted, setNotifGranted] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if ("Notification" in window) {
      setNotifGranted(Notification.permission === "granted")
    }
    // Registrasi Service Worker untuk notifikasi mobile
    registerServiceWorker()
  }, [])

  const handleRequestNotif = async () => {
    const granted = await requestNotificationPermission()
    setNotifGranted(granted)
    if (granted) {
      toast.success("Notifikasi diaktifkan")
      sendNotification("🔔 Notifikasi Aktif", {
        body: "Anda akan menerima peringatan jika pengeluaran melebihi anggaran.",
        icon: "/icon-192x192.png"
      })
    }
  }

  // Efek untuk menangani query param dari sidebar
  useEffect(() => {
    if (!mounted) return
    const newParam = searchParams.get("new")
    if (newParam) {
      if (newParam === "select") {
        setSelectorOpen(true)
      } else {
        setEditingTx(null)
        setDialogMode(newParam === "income" ? "Pemasukan" : "Pengeluaran")
        setDialogOpen(true)
      }
      
      // Hapus query param agar tidak terbuka lagi saat refresh
      const params = new URLSearchParams(searchParams.toString())
      params.delete("new")
      router.replace(`/?${params.toString()}`, { scroll: false })
    }
  }, [searchParams, router])

  const handleTypeSelect = (type: "Pemasukan" | "Pengeluaran") => {
    setSelectorOpen(false)
    setEditingTx(null)
    setDialogMode(type)
    setDialogOpen(true)
  }

  const openEditAccountDialog = (acc: any) => {
    setEditingAccount(acc)
    setAccountDialogOpen(true)
  }

  const handleAccountSubmit = async (data: any) => {
    if (!editingAccount) return
    
    const newBalance = parseFloat(data.initialBalance) || 0
    const oldBalance = editingAccount.currentBalance
    const diff = newBalance - oldBalance

    startTransition(async () => {
      // 1. Jika saldo bertambah, buat transaksi Pemasukan otomatis
      if (diff > 0) {
        const txData = {
          amount: diff.toString(),
          category: "Penyesuaian Saldo",
          description: `Penyesuaian saldo dompet ${data.name}`,
          type: "income" as const,
          date: new Date(),
          accountId: editingAccount.id
        }

        const txResult = await createTransaction(txData)
        
        if (txResult.success) {
          // Optimistic update agar langsung muncul di tabel
          const d = new Date()
          const formattedDate = `${String(d.getDate()).padStart(2, "0")} ${d.toLocaleString("id-ID", { month: "short" })}`.replace(".", "")
          
          addOptimisticAction({
            type: "ADD",
            transaction: {
              id: Math.random().toString(), // Temp ID
              date: formattedDate,
              rawDate: d.toISOString(),
              type: "Pemasukan",
              category: txData.category,
              note: txData.description,
              amount: diff,
              accountId: txData.accountId
            }
          })

          // 2. Update meta data akun (Nama & Jenis)
          // Tetap gunakan initialBalance lama agar tidak double counting
          const { initialBalance, ...metaData } = data
          await updateAccount(editingAccount.id, {
            ...metaData,
            initialBalance: editingAccount.initialBalance 
          })

          toast.success(`Saldo berhasil disesuaikan (+Rp ${diff.toLocaleString("id-ID")})`)
          router.refresh()
        } else {
          toast.error(txResult.error || "Gagal membuat transaksi penyesuaian")
        }
      } else {
        // 3. Jika saldo tetap atau berkurang, update normal
        const result = await updateAccount(editingAccount.id, data)
        if (result.success) {
          toast.success("Dompet berhasil diperbarui")
          router.refresh()
        } else {
          toast.error(result.error || "Gagal memperbarui dompet")
        }
      }
    })
  }

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
  const { stats, budgetProgress, accountBalances } = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear

    const monthlyTxs = optimisticTransactions.filter(t => {
      const d = new Date(t.rawDate)
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear
    })

    const lastMonthTxs = optimisticTransactions.filter(t => {
      const d = new Date(t.rawDate)
      return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear
    })

    const income = monthlyTxs.reduce((sum, t) => t.amount > 0 ? sum + Number(t.amount) : sum, 0)
    const expense = monthlyTxs.reduce((sum, t) => t.amount < 0 ? sum + Math.abs(Number(t.amount)) : sum, 0)
    
    // Calculate individual account balances
    const accountBalances = initialAccounts.map(acc => {
      const accTxs = optimisticTransactions.filter(t => t.accountId === acc.id)
      const txSum = accTxs.reduce((sum, t) => sum + Number(t.amount), 0)
      return {
        ...acc,
        currentBalance: Number(acc.initialBalance) + txSum
      }
    })

    // Total balance is sum of all account current balances
    const balance = accountBalances.reduce((sum, acc) => sum + acc.currentBalance, 0)

    const incomeLastMonth = lastMonthTxs.reduce((sum, t) => t.amount > 0 ? sum + Number(t.amount) : sum, 0)
    const expenseLastMonth = lastMonthTxs.reduce((sum, t) => t.amount < 0 ? sum + Math.abs(Number(t.amount)) : sum, 0)

    const incomeTrend = incomeLastMonth > 0 ? ((income - incomeLastMonth) / incomeLastMonth) * 100 : 0
    const expenseTrend = expenseLastMonth > 0 ? ((expense - expenseLastMonth) / expenseLastMonth) * 100 : 0

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

    return { 
      stats: { income, expense, balance, incomeTrend, expenseTrend }, 
      budgetProgress: progress,
      accountBalances
    }
  }, [optimisticTransactions, initialBudgets, initialCategories, initialAccounts])

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

  const handleSubmit = async (data: { amount: number; category: string; note: string; date: string; accountId?: number | null }) => {
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
        accountId: data.accountId,
      }
      startTransition(async () => {
        addOptimisticAction({ type: "UPDATE", transaction: updatedTxUI })
        const result = await updateTransaction(editingTx.id, {
           amount: Math.abs(data.amount).toString(),
           category: data.category,
           description: data.note,
           date: d,
           type: data.amount >= 0 ? "income" : "expense",
           accountId: data.accountId,
        })
        if (!result.success) toast.error(result.error || "Gagal memperbarui data")
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
        accountId: data.accountId,
      }
      startTransition(async () => {
        addOptimisticAction({ type: "ADD", transaction: newTxUI })
        
        // Cek apakah melebihi budget (Push Notification)
        if (data.amount < 0) {
           const category = initialCategories.find(c => c.name === data.category)
           const budget = initialBudgets.find(b => b.categoryId === category?.id)
           
           if (budget) {
             const now = new Date()
             const currentMonth = now.getMonth()
             const currentYear = now.getFullYear()
             
             // Hitung manual pengeluaran kategori ini di bulan ini (instan)
             const existingSpent = initialTransactions.filter(t => {
               const d = new Date(t.rawDate)
               return d.getMonth() === currentMonth && 
                      d.getFullYear() === currentYear && 
                      t.category === data.category && 
                      t.amount < 0
             }).reduce((sum, t) => sum + Math.abs(t.amount), 0)

             const totalSpent = existingSpent + Math.abs(data.amount)
             const limit = parseFloat(budget.limitAmount)
             
             if (totalSpent > limit) {
               const msg = `Pengeluaran ${data.category} (Rp ${totalSpent.toLocaleString("id-ID")}) melebihi batas Rp ${limit.toLocaleString("id-ID")}!`
               
               // 1. Sistem Notification
               sendNotification("⚠️ Anggaran Terlampaui!", {
                 body: msg,
                 tag: "budget-alert"
               })

               // 2. Fallback Toast (Jika notifikasi sistem diblokir)
               toast.error(msg, {
                 duration: 5000,
                 icon: <AlertCircle className="h-5 w-5" />
               })
             }
           }
        }

        const result = await createTransaction({
          description: data.note,
          amount: Math.abs(data.amount).toString(),
          category: data.category,
          type: data.amount >= 0 ? "income" : "expense",
          date: d,
          accountId: data.accountId,
        })
        if (!result.success) toast.error(result.error || "Gagal menyimpan data")
        else toast.success("Transaksi disimpan")
      })
    }
  }

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
         <h2 className="font-sans text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">Dashboard Overview</h2>
         <button 
           onClick={handleRequestNotif}
           className={cn(
             "flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-mono uppercase tracking-wider transition-colors",
             notifGranted ? "text-[#5a6b3b] bg-[#5a6b3b]/10" : "text-muted-foreground bg-muted hover:bg-muted/80"
           )}
         >
           {notifGranted ? <Bell className="h-3 w-3" /> : <BellOff className="h-3 w-3" />}
           {notifGranted ? "Notifikasi Aktif" : "Aktifkan Notifikasi"}
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          label="Saldo Total" 
          amount={stats.balance} 
          icon={Wallet} 
          color={stats.balance >= 0 ? "text-foreground" : "text-destructive"} 
          subLabel={`Akumulasi per ${new Date().toLocaleString("id-ID", { month: "long", year: "numeric" })}`}
        />
        <StatCard label="Masuk Bulan Ini" amount={stats.income} icon={TrendingUp} color="text-[#5a6b3b]" trend={stats.incomeTrend} />
        <StatCard label="Keluar Bulan Ini" amount={stats.expense} icon={TrendingDown} color="text-destructive" trend={stats.expenseTrend} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
           <ChartSection transactions={optimisticTransactions} />
           
           {/* Budget Progress Widget (BARU) */}
           {budgetProgress.length > 0 && (
             <div className="rounded-sm border border-border bg-card p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-sans text-sm font-bold uppercase tracking-[0.1em] text-foreground">Pantauan Anggaran</h3>
                  <div className="flex items-center gap-1 text-[11px] uppercase font-mono text-muted-foreground">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Real-time
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  {budgetProgress.map((bp) => (
                    <div key={bp.name} className="space-y-1.5">
                       <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-wider">
                          <span className="flex items-center gap-2 text-foreground font-bold">
                            <span>{bp.icon}</span>
                            {bp.name}
                          </span>
                          <span className="text-muted-foreground">
                            Rp {bp.spent.toLocaleString("id-ID")} / Rp {bp.limit.toLocaleString("id-ID")}
                          </span>
                       </div>
                       <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden border border-border/50">
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
        
        <CategoryDistribution transactions={optimisticTransactions} />
        <AccountSummary accounts={accountBalances} onEditAccount={openEditAccountDialog} />
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
        onNewEntry={() => setSelectorOpen(true)}
      />

      <TypeSelector
        open={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        onSelect={handleTypeSelect}
      />

      <InputDialog
        open={dialogOpen}
        mode={dialogMode}
        categories={initialCategories}
        accounts={initialAccounts}
        initialData={editingTx || undefined}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
      />

      <AccountDialog
        open={accountDialogOpen}
        initialData={editingAccount}
        onClose={() => setAccountDialogOpen(false)}
        onSubmit={handleAccountSubmit}
      />
    </div>
  )
}

function StatCard({ label, amount, icon: Icon, color, trend, subLabel }: { label: string; amount: number; icon: any; color: string; trend?: number; subLabel?: string }) {
  return (
    <div className="rounded-sm border border-border bg-card p-4 shadow-xs transition-all hover:shadow-md group">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-mono text-[13px] uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className={cn("mt-1 font-mono text-2xl font-bold tracking-tight lg:text-3xl", color)}>
            {amount < 0 ? "-" : ""}Rp {Math.abs(amount).toLocaleString("id-ID")}
          </p>
          
          {subLabel && (
            <p className="mt-2 font-serif text-[11px] italic text-muted-foreground lowercase">
              {subLabel}
            </p>
          )}

          {trend !== undefined && (
            <div className="mt-3 flex items-center gap-2">
              <span className={cn(
                "font-mono text-[11px] font-bold px-2 py-0.5 rounded-full border",
                trend > 0 ? "text-[#5a6b3b] border-[#5a6b3b]/20 bg-[#5a6b3b]/10" : 
                trend < 0 ? "text-destructive border-destructive/20 bg-destructive/10" : 
                "text-muted-foreground border-border bg-muted"
              )}>
                {trend > 0 ? "+" : ""}{trend.toFixed(1)}%
              </span>
              <span className="font-serif text-[11px] italic text-muted-foreground lowercase">vs bulan lalu</span>
            </div>
          )}
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/50 group-hover:bg-muted transition-colors">
          <Icon className={cn("h-6 w-6", color)} />
        </div>
      </div>
    </div>
  )
}
