"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { TransactionsTable, type Transaction as UITransaction } from "./transactions-table"
import { InputDialog, type InputMode } from "./input-dialog"
import { updateTransaction, deleteTransaction } from "@/lib/actions/transactions"
import { toast } from "sonner"

interface Category {
  id: number
  name: string
  type: string
}

interface Account {
  id: number
  name: string
  type: string
}

interface HistoryTransactionsClientProps {
  transactions: UITransaction[]
  categories: Category[]
  accounts: Account[]
}

export function HistoryTransactionsClient({ transactions, categories, accounts }: HistoryTransactionsClientProps) {
  const router = useRouter()
  const [editingTx, setEditingTx] = useState<UITransaction | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [mode, setMode] = useState<InputMode>("Pemasukan")
  const [isPending, startTransition] = useTransition()

  const openEditDialog = (tx: UITransaction) => {
    setEditingTx(tx)
    setMode(tx.type === "Pemasukan" ? "Pemasukan" : "Pengeluaran")
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditingTx(null)
  }

  const handleEditSubmit = async (data: { amount: number; category: string; note: string; date: string; accountId?: number | null }) => {
    if (!editingTx) return

    const parsedDate = new Date(data.date)

    startTransition(async () => {
      const result = await updateTransaction(editingTx.id, {
        amount: data.amount.toString(),
        category: data.category,
        description: data.note,
        date: parsedDate,
        type: data.amount >= 0 ? "income" : "expense",
        accountId: data.accountId,
      })

      if (!result.success) {
        toast.error(result.error || "Gagal memperbarui transaksi")
        return
      }

      toast.success("Transaksi diperbarui")
      closeDialog()
      router.refresh()
    })
  }

  const handleDelete = async (id: string) => {
    startTransition(async () => {
      const result = await deleteTransaction(id)
      if (!result.success) {
        toast.error(result.error || "Gagal menghapus transaksi")
        return
      }

      toast.success("Transaksi dihapus")
      router.refresh()
    })
  }

  return (
    <>
      <TransactionsTable
        transactions={transactions}
        onEdit={openEditDialog}
        onDelete={handleDelete}
      />

      <InputDialog
        open={dialogOpen}
        mode={mode}
        categories={categories}
        accounts={accounts}
        initialData={editingTx ? {
          amount: Math.abs(editingTx.amount),
          category: editingTx.category,
          note: editingTx.note,
          date: editingTx.rawDate,
          accountId: editingTx.accountId ?? undefined,
          rawDate: editingTx.rawDate,
        } : undefined}
        onClose={closeDialog}
        onSubmit={handleEditSubmit}
        isPending={isPending}
      />
    </>
  )
}
