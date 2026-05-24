"use client"

import { useState, useTransition, useOptimistic, useMemo } from "react"
import { Plus, Trash2, Tag, Target, Wallet, Pencil, RefreshCcw } from "lucide-react"
import { createCategory, deleteCategory } from "@/lib/actions/categories"
import { upsertBudget } from "@/lib/actions/budgets"
import { createAccount, deleteAccount, updateAccount, hardResetDatabase } from "@/lib/actions/accounts"
import { transferFunds } from "@/lib/actions/transactions"
import { TransferDialog } from "../accounts/transfer-dialog"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

import { AmountInput } from "@/components/ui/amount-input"
import { AccountDialog } from "../accounts/account-dialog"
import { useRouter } from "next/navigation"

interface Category {
  id: number
  userId: string
  name: string
  type: string
}

interface Budget {
  id: number
  categoryId: number
  limitAmount: string
  month: number
  year: number
}

interface Account {
  id: number
  userId: string
  name: string
  type: string
  initialBalance: string
  color: string | null
  currentBalance?: number
}

interface CategoriesClientProps {
  initialCategories: Category[]
  initialBudgets: Budget[]
  initialAccounts: Account[]
  initialTransactions: { amount: string; category: string; date: Date; accountId: number | null; type: string }[]
}

export function CategoriesClient({ 
  initialCategories, 
  initialBudgets, 
  initialAccounts,
  initialTransactions 
}: CategoriesClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"categories" | "accounts">("categories")
  const [isPending, startTransition] = useTransition()
  
  // State for Account Editing
  const [editingAccount, setEditingAccount] = useState<Account | undefined>(undefined)
  const [accountDialogOpen, setAccountDialogOpen] = useState(false)

  const [optimisticCategories, addOptimisticCategory] = useOptimistic(
    initialCategories,
    (state, action: { type: "ADD" | "DELETE"; category?: Category; id?: number }) => {
      if (action.type === "ADD" && action.category) {
        return [...state, action.category]
      }
      if (action.type === "DELETE" && action.id) {
        return state.filter((c) => c.id !== action.id)
      }
      return state
    }
  )

  const categoryStats = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    return optimisticCategories.map(cat => {
      const catTxs = initialTransactions.filter(t => {
        const txDate = new Date(t.date)
        return t.category === cat.name && 
               txDate.getMonth() === currentMonth && 
               txDate.getFullYear() === currentYear
      })
      
      const totalAmount = catTxs.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)
      const count = catTxs.length
      
      return {
        ...cat,
        spent: totalAmount,
        txCount: count
      }
    })
  }, [optimisticCategories, initialTransactions])


  const handleEditAccount = (acc: Account) => {
    setEditingAccount(acc)
    setAccountDialogOpen(true)
  }

  const handleAccountSubmit = async (data: { name: string; type: string; initialBalance: string }) => {
    if (!editingAccount) return
    
    startTransition(async () => {
      const result = await updateAccount(editingAccount.id, data)
      if (result.success) {
        toast.success("Dompet berhasil diperbarui")
        setAccountDialogOpen(false)
        router.refresh()
      } else {
        toast.error(result.error || "Gagal memperbarui dompet")
      }
    })
  }

  const handleTransferSubmit = async (data: { fromAccountId: number; toAccountId: number; fromAccountName: string; toAccountName: string; amount: string; date: Date }) => {
    startTransition(async () => {
      const result = await transferFunds(data)
      if (result.success) {
        toast.success("Transfer berhasil dilakukan")
        setTransferDialogOpen(false)
        router.refresh()
      } else {
        toast.error(result.error || "Gagal melakukan transfer")
      }
    })
  }

  // State for Categories
  const [name, setName] = useState("")
  const [type, setType] = useState<"income" | "expense">("expense")

  // State for Accounts
  const [accountName, setAccountName] = useState("")
  const [accountType, setAccountType] = useState("bank")
  const [initialBalance, setInitialBalance] = useState("0")
  const [transferDialogOpen, setTransferDialogOpen] = useState(false)

  // State untuk input budget per kategori
  const [budgetInputs, setBudgetInputs] = useState<Record<number, string>>(() => {
    const initial: Record<number, string> = {}
    initialBudgets.forEach(b => {
      initial[b.categoryId] = parseFloat(b.limitAmount).toString()
    })
    return initial
  })

  const [optimisticAccounts, addOptimisticAccount] = useOptimistic(
    initialAccounts,
    (state, action: { type: "ADD" | "DELETE"; account?: Account; id?: number }) => {
      if (action.type === "ADD" && action.account) {
        return [...state, action.account]
      }
      if (action.type === "DELETE" && action.id) {
        return state.filter((a) => a.id !== action.id)
      }
      return state
    }
  )

  const accountBalances = useMemo(() => {
    return optimisticAccounts.map(acc => {
      const accTxs = initialTransactions.filter(t => t.accountId === acc.id)
      
      // Calculate income and expense for this account - filtering out transfers, initial balance and adjustments
      const income = accTxs
        .filter(t => {
          const isTechnical = t.category.startsWith("Transfer") || 
                             t.category === "Saldo Awal" || 
                             t.category === "Penyesuaian Saldo"
          return !isTechnical && (t.type === "income" || t.type === "Pemasukan")
        })
        .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)
        
      const expense = accTxs
        .filter(t => {
          const isTechnical = t.category.startsWith("Transfer") || 
                             t.category === "Penyesuaian Saldo"
          return !isTechnical && (t.type === "expense" || t.type === "Pengeluaran")
        })
        .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)

      const txSum = accTxs.reduce((sum, t) => {
        const amt = Math.abs(Number(t.amount))
        return (t.type === "income" || t.type === "Pemasukan") ? sum + amt : sum - amt
      }, 0)

      return {
        ...acc,
        currentBalance: Number(acc.initialBalance) + txSum,
        income,
        expense,
        txCount: accTxs.length
      }
    })
  }, [optimisticAccounts, initialTransactions])

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    startTransition(async () => {
      const result = await createCategory({
        name: name.trim(),
        type: type,
      })
      if (!result.success) toast.error("Gagal menambah kategori")
      else {
        toast.success("Kategori berhasil ditambahkan")
        setName("")
      }
    })
  }

  const handleDeleteCategory = async (id: number) => {
    if (!confirm("Hapus kategori ini? Semua anggaran terkait juga akan hilang.")) return
    startTransition(async () => {
      addOptimisticCategory({ type: "DELETE", id })
      const result = await deleteCategory(id)
      if (!result.success) toast.error("Gagal menghapus kategori")
    })
  }

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accountName.trim()) return
    
    startTransition(async () => {
      const result = await createAccount({
        name: accountName.trim(),
        type: accountType,
        initialBalance: initialBalance || "0",
      })
      
      if (!result.success) toast.error("Gagal menambah dompet")
      else {
        toast.success("Dompet berhasil ditambahkan")
        setAccountName("")
        setInitialBalance("0")
      }
    })
  }

  const handleDeleteAccount = async (id: number) => {
    if (!confirm("Hapus dompet ini? Riwayat transaksi mungkin akan terpengaruh.")) return
    
    startTransition(async () => {
      addOptimisticAccount({ type: "DELETE", id })
      const result = await deleteAccount(id)
      if (!result.success) toast.error("Gagal menghapus dompet")
    })
  }

  const handleSaveBudget = async (categoryId: number) => {
    const amount = budgetInputs[categoryId] || "0"
    const now = new Date()
    startTransition(async () => {
      const result = await upsertBudget({
        categoryId,
        limitAmount: amount,
        month: now.getMonth(),
        year: now.getFullYear()
      })
      if (!result.success) toast.error("Gagal menyimpan anggaran")
      else toast.success("Anggaran diperbarui")
    })
  }

  const handleHardReset = async () => {
    if (!confirm("⚠️ PERINGATAN KERAS: Apakah Anda yakin ingin MENGHAPUS SEMUA DATA? \n\nTindakan ini akan:\n1. Menghapus SEMUA dompet.\n2. Menghapus SEMUA kategori.\n3. Menghapus SEMUA transaksi & riwayat.\n4. Menghapus SEMUA target tabungan & anggaran.\n\nDATABASE AKAN KOSONG TOTAL. Data TIDAK DAPAT dikembalikan!")) return
    
    startTransition(async () => {
      const result = await hardResetDatabase()
      if (result.success) {
        toast.success("Database berhasil dibersihkan total")
        router.refresh()
      } else {
        toast.error(result.error || "Gagal melakukan hard reset")
      }
    })
  }

  return (
    <div className="p-4 lg:p-8">
      <header className="mb-8">
        <h2 className="font-sans text-xl font-bold tracking-tight">Manajemen Keuangan</h2>
        <p className="font-serif text-sm italic text-muted-foreground">Atur kategori pengeluaran dan kelola sumber dana Anda.</p>
        
        {/* Tab Switcher */}
        <div className="flex gap-2 mt-6 border-b border-border overflow-x-auto no-scrollbar whitespace-nowrap">
          <button 
            onClick={() => setActiveTab("categories")}
            className={cn(
              "px-4 py-2 font-mono text-[10px] uppercase tracking-widest transition-all border-b-2",
              activeTab === "categories" ? "border-primary text-primary" : "border-transparent text-muted-foreground"
            )}
          >
            Kategori & Anggaran
          </button>
          <button 
            onClick={() => setActiveTab("accounts")}
            className={cn(
              "px-4 py-2 font-mono text-[10px] uppercase tracking-widest transition-all border-b-2",
              activeTab === "accounts" ? "border-primary text-primary" : "border-transparent text-muted-foreground"
            )}
          >
            Dompet & Sumber Dana
          </button>
          <button 
             onClick={() => setTransferDialogOpen(true)}
             className="ml-auto flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-mono uppercase tracking-widest transition-all bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
           >
             Transfer Dana
           </button>
        </div>
      </header>

      {activeTab === "categories" ? (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-fit">
            <AnimatePresence mode="popLayout">
            {categoryStats.map((cat) => {
              const budget = parseFloat(budgetInputs[cat.id] || "0")
              const percent = budget > 0 ? Math.min(100, (cat.spent / budget) * 100) : 0
              const isOverBudget = budget > 0 && cat.spent > budget

              return (
                <motion.div 
                  key={cat.id} 
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col p-5 rounded-sm border border-border bg-card shadow-xs group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-sans text-sm font-bold">{cat.name}</p>
                        <p className={cn(
                          "font-mono text-[10px] uppercase tracking-wider",
                          cat.type === "income" ? "text-[#5a6b3b]" : "text-destructive"
                        )}>{cat.type === "income" ? "Pemasukan" : "Pengeluaran"}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCategory(cat.id);
                        }}
                        className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-2 -m-1 cursor-pointer"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                      <span className="font-mono text-[9px] text-muted-foreground uppercase">{cat.txCount} Transaksi</span>
                    </div>
                  </div>

                  <div className="mt-2 space-y-3">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="font-mono text-[9px] uppercase tracking-tighter text-muted-foreground mb-0.5">Realisasi Bulan Ini</p>
                        <p className={cn(
                          "font-mono text-sm font-bold",
                          isOverBudget ? "text-destructive" : "text-foreground"
                        )}>
                          Rp {cat.spent.toLocaleString("id-ID")}
                        </p>
                      </div>
                      {budget > 0 && (
                        <p className="font-mono text-[10px] text-muted-foreground">
                          {percent.toFixed(0)}% dari anggaran
                        </p>
                      )}
                    </div>

                    {budget > 0 && (
                      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div 
                          className={cn(
                            "h-full transition-all duration-500",
                            isOverBudget ? "bg-destructive" : "bg-primary"
                          )} 
                          style={{ width: `${percent}%` }} 
                        />
                      </div>
                    )}
                  </div>

                  {cat.type === "expense" && (
                    <div className="relative mt-4 flex items-center gap-2 border-t border-dashed border-border pt-4">
                      <Target className="h-3.5 w-3.5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-mono text-[9px] uppercase tracking-tighter text-muted-foreground mb-1">Set Anggaran Bulanan (Rp)</p>
                        <input 
                          type="number"
                          value={budgetInputs[cat.id] || ""}
                          onChange={(e) => setBudgetInputs(prev => ({ ...prev, [cat.id]: e.target.value }))}
                          onBlur={() => handleSaveBudget(cat.id)}
                          placeholder="0"
                          className="w-full bg-transparent border-none p-0 font-mono text-xs focus:ring-0 focus:outline-none placeholder:text-muted-foreground/30"
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              )
            })}
            </AnimatePresence>
          </div>

          <aside className="rounded-sm border border-border bg-card p-6 h-fit shadow-xs">
            <h3 className="font-sans text-sm font-bold uppercase tracking-wider mb-4">Kategori Baru</h3>
            <form onSubmit={handleAddCategory} className="flex flex-col gap-4">
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Judul</label>
                <input 
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Mis. Internet..."
                  className="w-full rounded-sm border border-border bg-background px-3 py-2 font-serif text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-1.5">
                 <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Tipe Arus Kas</label>
                 <div className="flex gap-1 bg-muted p-1 rounded-sm">
                    <button type="button" onClick={() => setType("expense")} className={cn("flex-1 py-1 rounded-sm text-[10px] font-mono uppercase", type === "expense" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground")}>Keluar</button>
                    <button type="button" onClick={() => setType("income")} className={cn("flex-1 py-1 rounded-sm text-[10px] font-mono uppercase", type === "income" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground")}>Masuk</button>
                 </div>
              </div>
              <button 
                type="submit" 
                disabled={isPending}
                className="w-full bg-primary text-primary-foreground py-2 font-sans text-xs font-bold rounded-sm tracking-widest hover:bg-primary/90 transition-colors uppercase disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <>
                    <motion.div 
                      animate={{ rotate: 360 }} 
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="h-3 w-3 border-2 border-primary-foreground border-t-transparent rounded-full" 
                    />
                    Memproses...
                  </>
                ) : (
                  "Tambah"
                )}
              </button>
            </form>
          </aside>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-fit">
            <AnimatePresence mode="popLayout">
            {accountBalances.map((acc) => (
              <motion.div 
                key={acc.id} 
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col p-5 rounded-sm border border-border bg-card shadow-xs group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl p-2 bg-muted rounded-sm">
                      <Wallet className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-sans text-sm font-bold">{acc.name}</p>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {acc.type.replace("_", " ")}
                      </p>
                    </div>
                  </div>
                    <div className="flex items-center gap-2">
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditAccount(acc);
                        }}
                        className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 text-muted-foreground hover:text-primary transition-all p-2 -m-1 cursor-pointer"
                      >
                        <Pencil className="h-4.5 w-4.5" />
                      </button>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAccount(acc.id);
                        }}
                        className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-2 -m-1 cursor-pointer"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                </div>
                <div className="mt-5 pt-4 border-t border-dashed border-border grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                     <div className="flex items-center gap-1.5 text-emerald-600">
                        <Plus className="h-3 w-3" />
                        <span className="font-mono text-[9px] uppercase tracking-tighter font-bold">Pemasukan</span>
                     </div>
                     <p className="font-mono text-[11px] font-bold">
                       Rp {acc.income?.toLocaleString('id-ID')}
                     </p>
                   </div>
                   <div className="space-y-1 text-right">
                     <div className="flex items-center gap-1.5 text-rose-600 justify-end">
                        <span className="font-mono text-[9px] uppercase tracking-tighter font-bold">Pengeluaran</span>
                        <Plus className="h-3 w-3 rotate-45" />
                     </div>
                     <p className="font-mono text-[11px] font-bold">
                       Rp {acc.expense?.toLocaleString('id-ID')}
                     </p>
                   </div>
                </div>

                <div className="mt-4 pt-3 flex justify-between items-center bg-muted/30 -mx-5 -mb-5 px-5 py-3 rounded-b-sm border-t border-border/50">
                    <div className="flex items-center gap-2">
                        <Tag className="h-3 w-3 text-muted-foreground" />
                        <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                            {acc.txCount} Transaksi
                        </span>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-[10px] font-bold text-primary">
                         Rp {acc.currentBalance?.toLocaleString('id-ID')}
                      </p>
                      <p className="font-mono text-[8px] uppercase tracking-tighter text-muted-foreground">Saldo Akhir</p>
                    </div>
                </div>
              </motion.div>
            ))}
            </AnimatePresence>
          </div>

          <aside className="rounded-sm border border-border bg-card p-6 h-fit shadow-xs">
            <h3 className="font-sans text-sm font-bold uppercase tracking-wider mb-4">Dompet Baru</h3>
            <form onSubmit={handleAddAccount} className="flex flex-col gap-4">
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Nama Dompet</label>
                <input 
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Mis. BCA, GoPay..."
                  className="w-full rounded-sm border border-border bg-background px-3 py-2 font-serif text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Jenis Dompet</label>
                <select 
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value)}
                  className="w-full rounded-sm border border-border bg-background px-3 py-2 font-serif text-sm focus:outline-none focus:border-primary"
                >
                  <option value="bank">Bank</option>
                  <option value="e-wallet">E-Wallet</option>
                  <option value="cash">Tunai (Cash)</option>
                  <option value="credit_card">Kartu Kredit</option>
                </select>
              </div>
              <AmountInput 
                label="Saldo Awal (Rp)"
                value={initialBalance}
                onChange={setInitialBalance}
              />
              <button 
                type="submit" 
                disabled={isPending}
                className="w-full bg-primary text-primary-foreground py-2 font-sans text-xs font-bold rounded-sm tracking-widest hover:bg-primary/90 transition-colors uppercase disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <>
                    <motion.div 
                      animate={{ rotate: 360 }} 
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="h-3 w-3 border-2 border-primary-foreground border-t-transparent rounded-full" 
                    />
                    Memproses...
                  </>
                ) : (
                  "Tambah Dompet"
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-dashed border-border">
              <h3 className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] mb-4 text-destructive">Zona Bahaya</h3>
              <button 
                type="button"
                onClick={handleHardReset}
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-destructive/30 text-destructive hover:bg-destructive hover:text-white transition-all rounded-sm font-mono text-[10px] uppercase tracking-widest disabled:opacity-50"
              >
                <RefreshCcw className={cn("h-3.5 w-3.5", isPending && "animate-spin")} />
                Hapus & Reset Total DB
              </button>
              <p className="mt-2 text-[9px] text-muted-foreground italic leading-relaxed text-center px-2">
                Hapus permanen seluruh data (Dompet, Kategori, Transaksi) untuk mulai dari nol.
              </p>
            </div>
          </aside>
        </div>
      )}

      <AccountDialog
        open={accountDialogOpen}
        initialData={editingAccount || undefined}
        onClose={() => setAccountDialogOpen(false)}
        onSubmit={handleAccountSubmit}
        isPending={isPending}
      />

      <TransferDialog
        open={transferDialogOpen}
        accounts={accountBalances}
        onClose={() => setTransferDialogOpen(false)}
        onSubmit={handleTransferSubmit}
      />
    </div>
  )
}
