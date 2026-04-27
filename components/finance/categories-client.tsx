"use client"

import { useState, useTransition, useOptimistic, useMemo } from "react"
import { Plus, Trash2, Tag, Target, Wallet, Landmark, CreditCard, Banknote, Pencil } from "lucide-react"
import { createCategory, deleteCategory } from "@/lib/actions/categories"
import { upsertBudget } from "@/lib/actions/budgets"
import { createAccount, deleteAccount, updateAccount } from "@/lib/actions/accounts"
import { createTransaction } from "@/lib/actions/transactions"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import { AmountInput } from "@/components/ui/amount-input"
import { AccountDialog } from "@/components/finance/account-dialog"
import { useRouter } from "next/navigation"

interface Category {
  id: number
  userId: string
  name: string
  type: "income" | "expense"
  icon: string | null
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
  icon: string | null
  color: string | null
  currentBalance?: number
}

interface CategoriesClientProps {
  initialCategories: Category[]
  initialBudgets: Budget[]
  initialAccounts: Account[]
  initialTransactions: any[]
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
  const [editingAccount, setEditingAccount] = useState<any | null>(null)
  const [accountDialogOpen, setAccountDialogOpen] = useState(false)

  const accountBalances = useMemo(() => {
    return initialAccounts.map(acc => {
      const accTxs = initialTransactions.filter(t => t.accountId === acc.id)
      const txSum = accTxs.reduce((sum, t) => sum + Number(t.amount), 0)
      return {
        ...acc,
        currentBalance: Number(acc.initialBalance) + txSum
      }
    })
  }, [initialAccounts, initialTransactions])

  const handleEditAccount = (acc: any) => {
    setEditingAccount(acc)
    setAccountDialogOpen(true)
  }

  const handleAccountSubmit = async (data: any) => {
    if (!editingAccount) return
    
    const newBalance = parseFloat(data.initialBalance) || 0
    const oldBalance = editingAccount.currentBalance
    const diff = newBalance - oldBalance

    startTransition(async () => {
      if (diff > 0) {
        await createTransaction({
          amount: diff.toString(),
          category: "Penyesuaian Saldo",
          description: `Penyesuaian saldo akun ${data.name}`,
          type: "income",
          date: new Date(),
          accountId: editingAccount.id
        })
        
        const { initialBalance, ...metaData } = data
        await updateAccount(editingAccount.id, {
          ...metaData,
          initialBalance: editingAccount.initialBalance 
        })
        toast.success(`Saldo berhasil disesuaikan (+Rp ${diff.toLocaleString("id-ID")})`)
      } else {
        const result = await updateAccount(editingAccount.id, data)
        if (result.success) toast.success("Akun berhasil diperbarui")
        else toast.error(result.error || "Gagal memperbarui akun")
      }
      router.refresh()
    })
  }
  
  // State for Categories
  const [name, setName] = useState("")
  const [type, setType] = useState<"income" | "expense">("expense")

  // State for Accounts
  const [accountName, setAccountName] = useState("")
  const [accountType, setAccountType] = useState("bank")
  const [initialBalance, setInitialBalance] = useState("0")

  // State untuk input budget per kategori
  const [budgetInputs, setBudgetInputs] = useState<Record<number, string>>(() => {
    const initial: Record<number, string> = {}
    initialBudgets.forEach(b => {
      initial[b.categoryId] = parseFloat(b.limitAmount).toString()
    })
    return initial
  })

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

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    startTransition(async () => {
      const result = await createCategory({
        name: name.trim(),
        type: type,
        icon: type === "income" ? "💰" : "🛒"
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
      const icons = {
        bank: "🏦",
        cash: "💵",
        "e-wallet": "📱",
        credit_card: "💳"
      }
      
      const result = await createAccount({
        name: accountName.trim(),
        type: accountType,
        initialBalance: initialBalance || "0",
        icon: icons[accountType as keyof typeof icons] || "💰"
      })
      
      if (!result.success) toast.error("Gagal menambah akun")
      else {
        toast.success("Akun berhasil ditambahkan")
        setAccountName("")
        setInitialBalance("0")
      }
    })
  }

  const handleDeleteAccount = async (id: number) => {
    if (!confirm("Hapus akun ini? Riwayat transaksi mungkin akan terpengaruh.")) return
    startTransition(async () => {
      addOptimisticAccount({ type: "DELETE", id })
      const result = await deleteAccount(id)
      if (!result.success) toast.error("Gagal menghapus akun")
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

  return (
    <div className="p-4 lg:p-8">
      <header className="mb-8">
        <h2 className="font-sans text-xl font-bold tracking-tight">Manajemen Keuangan</h2>
        <p className="font-serif text-sm italic text-muted-foreground">Atur kategori pengeluaran dan kelola sumber dana Anda.</p>
        
        {/* Tab Switcher */}
        <div className="flex gap-2 mt-6 border-b border-border">
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
            Akun & Dompet
          </button>
        </div>
      </header>

      {activeTab === "categories" ? (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-fit">
            {optimisticCategories.map((cat) => (
              <div key={cat.id} className="flex flex-col p-5 rounded-sm border border-border bg-card shadow-xs group">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{cat.icon || "📁"}</span>
                    <div>
                      <p className="font-sans text-sm font-bold">{cat.name}</p>
                      <p className={cn(
                        "font-mono text-[10px] uppercase tracking-wider",
                        cat.type === "income" ? "text-[#5a6b3b]" : "text-destructive"
                      )}>{cat.type === "income" ? "Pemasukan" : "Pengeluaran"}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {cat.type === "expense" && (
                  <div className="relative mt-2 flex items-center gap-2 border-t border-dashed border-border pt-4">
                    <Target className="h-3.5 w-3.5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-mono text-[9px] uppercase tracking-tighter text-muted-foreground mb-1">Anggaran Bulanan (Rp)</p>
                      <input 
                        type="number"
                        value={budgetInputs[cat.id] || ""}
                        onChange={(e) => setBudgetInputs(prev => ({ ...prev, [cat.id]: e.target.value }))}
                        onBlur={() => handleSaveBudget(cat.id)}
                        placeholder="Contoh: 500000"
                        className="w-full bg-transparent border-none p-0 font-mono text-xs focus:ring-0 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
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
              <button type="submit" className="w-full bg-primary text-primary-foreground py-2 font-sans text-xs font-bold rounded-sm tracking-widest hover:bg-primary/90 transition-colors uppercase">Tambah</button>
            </form>
          </aside>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-fit">
            {accountBalances.map((acc) => (
              <div key={acc.id} className="flex flex-col p-5 rounded-sm border border-border bg-card shadow-xs group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl p-2 bg-muted rounded-sm">
                      {acc.type === "bank" && <Landmark className="h-5 w-5" />}
                      {acc.type === "cash" && <Banknote className="h-5 w-5" />}
                      {acc.type === "e-wallet" && <Wallet className="h-5 w-5" />}
                      {acc.type === "credit_card" && <CreditCard className="h-5 w-5" />}
                    </span>
                    <div>
                      <p className="font-sans text-sm font-bold">{acc.name}</p>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {acc.type.replace("_", " ")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => handleEditAccount(acc)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-all p-1"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteAccount(acc.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-dashed border-border flex justify-between items-end">
                   <div>
                     <p className="font-mono text-[9px] uppercase tracking-tighter text-muted-foreground mb-1">Saldo Saat Ini</p>
                     <p className="font-mono text-sm font-bold">
                       Rp {acc.currentBalance?.toLocaleString('id-ID')}
                     </p>
                   </div>
                   <div className="text-right">
                     <p className="font-mono text-[9px] uppercase tracking-tighter text-muted-foreground mb-1 text-right">Saldo Awal</p>
                     <p className="font-mono text-[10px] text-muted-foreground">
                       Rp {parseFloat(acc.initialBalance).toLocaleString('id-ID')}
                     </p>
                   </div>
                </div>
              </div>
            ))}
          </div>

          <aside className="rounded-sm border border-border bg-card p-6 h-fit shadow-xs">
            <h3 className="font-sans text-sm font-bold uppercase tracking-wider mb-4">Akun Baru</h3>
            <form onSubmit={handleAddAccount} className="flex flex-col gap-4">
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Nama Akun</label>
                <input 
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Mis. BCA, GoPay..."
                  className="w-full rounded-sm border border-border bg-background px-3 py-2 font-serif text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Jenis Akun</label>
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
              <button type="submit" className="w-full bg-primary text-primary-foreground py-2 font-sans text-xs font-bold rounded-sm tracking-widest hover:bg-primary/90 transition-colors uppercase">Buat Akun</button>
            </form>
          </aside>
        </div>
      )}

      <AccountDialog
        open={accountDialogOpen}
        initialData={editingAccount}
        onClose={() => setAccountDialogOpen(false)}
        onSubmit={handleAccountSubmit}
      />
    </div>
  )
}
