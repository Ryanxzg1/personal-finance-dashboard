"use client"

import { useState, useEffect } from "react"
import { X, ArrowRight } from "lucide-react"
import { AmountInput } from "@/components/ui/amount-input"

interface Account {
  id: number
  name: string
  type: string
  currentBalance?: number
}

interface TransferDialogProps {
  open: boolean
  accounts: Account[]
  onClose: () => void
  onSubmit: (data: { 
    fromAccountId: number; 
    toAccountId: number; 
    fromAccountName: string;
    toAccountName: string;
    amount: string; 
    date: Date 
  }) => void
}

export function TransferDialog({ open, accounts, onClose, onSubmit }: TransferDialogProps) {
  const [amount, setAmount] = useState("")
  const [fromAccountId, setFromAccountId] = useState<number | "">("")
  const [toAccountId, setToAccountId] = useState<number | "">("")
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setAmount("")
      setFromAccountId(accounts.length > 0 ? accounts[0].id : "")
      setToAccountId(accounts.length > 1 ? accounts[1].id : "")
      setDate(new Date().toISOString().slice(0, 10))
      setError(null)
    }
  }, [open, accounts])

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const num = Number(amount.replace(/[^\d]/g, ""))
    
    if (!num || num <= 0) {
      setError("Jumlah transfer harus lebih dari nol.")
      return
    }
    if (!fromAccountId || !toAccountId) {
      setError("Pilih dompet asal dan tujuan.")
      return
    }
    if (fromAccountId === toAccountId) {
      setError("Dompet asal dan tujuan tidak boleh sama.")
      return
    }

    const fromAcc = accounts.find(a => a.id === fromAccountId)
    const toAcc = accounts.find(a => a.id === toAccountId)

    onSubmit({
      fromAccountId: fromAccountId as number,
      toAccountId: toAccountId as number,
      fromAccountName: fromAcc?.name || "Dompet Asal",
      toAccountName: toAcc?.name || "Dompet Tujuan",
      amount: num.toString(),
      date: new Date(date),
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/40 backdrop-blur-[1px]"
      />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-md rounded-sm border border-border bg-card p-6 shadow-lg"
      >
        <div className="flex items-start justify-between border-b border-dashed border-border pb-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Transaksi Baru</p>
            <h2 className="mt-1 font-sans text-xl font-bold tracking-tight text-primary">Transfer Saldo</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-5">
          <div className="space-y-1.5">
            <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Tanggal</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-sm border border-input bg-background px-3 py-2 font-serif text-sm focus:border-primary focus:outline-none"
              required
            />
          </div>

          <AmountInput 
            label="Nominal Transfer (Rp)"
            value={amount}
            onChange={setAmount}
          />

          <div className="grid grid-cols-[1fr_40px_1fr] items-center gap-2">
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Dari</label>
              <select
                value={fromAccountId}
                onChange={(e) => setFromAccountId(Number(e.target.value))}
                className="w-full rounded-sm border border-input bg-background px-2 py-2 font-serif text-xs focus:border-primary focus:outline-none"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>
            
            <div className="flex justify-center mt-4">
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Ke</label>
              <select
                value={toAccountId}
                onChange={(e) => setToAccountId(Number(e.target.value))}
                className="w-full rounded-sm border border-input bg-background px-2 py-2 font-serif text-xs focus:border-primary focus:outline-none"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="rounded-sm border border-destructive/30 bg-destructive/10 px-3 py-2 font-serif text-xs text-destructive">
              {error}
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-2 border-t border-dashed border-border pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm px-4 py-2 font-serif text-sm text-muted-foreground hover:text-foreground"
          >
            Batal
          </button>
          <button
            type="submit"
            className="rounded-sm bg-primary px-4 py-2 font-sans text-sm font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors uppercase tracking-widest"
          >
            Lakukan Transfer
          </button>
        </div>
      </form>
    </div>
  )
}
