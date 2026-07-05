"use client"

import { useEffect, useState } from "react"
import { X, ArrowUpCircle, ArrowDownCircle } from "lucide-react"
import { AmountInput } from "@/components/ui/amount-input"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface AdjustBalanceDialogProps {
  open: boolean
  account?: { id: number; name: string; currentBalance: number }
  onClose: () => void
  onSubmit: (data: { accountId: number; direction: "increase" | "decrease"; amount: string; note: string }) => void
  isPending?: boolean
}

export function AdjustBalanceDialog({ open, account, onClose, onSubmit, isPending }: AdjustBalanceDialogProps) {
  const [direction, setDirection] = useState<"increase" | "decrease">("increase")
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setDirection("increase")
      setAmount("")
      setNote("")
      setError(null)
    }
  }, [open, account])

  if (!open || !account) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0) {
      setError("Nominal harus lebih dari 0.")
      return
    }
    onSubmit({
      accountId: account.id,
      direction,
      amount,
      note: note.trim()
    })
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.button
            type="button"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-foreground/40 backdrop-blur-[1px]"
          />

          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.3 }}
            className="relative z-10 w-full max-w-md rounded-sm border border-border bg-card p-6 shadow-lg"
          >
            <div className="flex items-start justify-between gap-4 border-b border-dashed border-border pb-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Koreksi Saldo
                </p>
                <h2 className="mt-1 font-sans text-2xl font-bold tracking-tight">
                  Sesuaikan Dompet
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-sm p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 flex flex-col gap-5">
              <div className="rounded-sm border border-border bg-muted/30 p-3 flex flex-col">
                <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">Saldo {account.name} Saat Ini</span>
                <span className={cn("font-mono text-xl font-bold tabular-nums mt-1", account.currentBalance >= 0 ? "text-foreground" : "text-destructive")}>
                  {account.currentBalance < 0 ? "-" : ""}Rp {Math.abs(account.currentBalance).toLocaleString("id-ID")}
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Arah Penyesuaian</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDirection("increase")}
                    className={cn(
                      "flex items-center gap-2 p-2.5 rounded-sm border font-mono text-xs uppercase tracking-wider transition-colors",
                      direction === "increase"
                        ? "border-[#5a6b3b] bg-[#5a6b3b]/10 text-[#5a6b3b] font-bold" 
                        : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                    )}
                  >
                    <ArrowUpCircle className="h-4 w-4" />
                    Tambah Saldo
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirection("decrease")}
                    className={cn(
                      "flex items-center gap-2 p-2.5 rounded-sm border font-mono text-xs uppercase tracking-wider transition-colors",
                      direction === "decrease"
                        ? "border-destructive bg-destructive/10 text-destructive font-bold" 
                        : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                    )}
                  >
                    <ArrowDownCircle className="h-4 w-4" />
                    Kurangi Saldo
                  </button>
                </div>
              </div>

              <AmountInput 
                label="Nominal Selisih (Rp)"
                value={amount}
                onChange={setAmount}
                helperText={`Masukkan nominal uang yang akan di${direction === "increase" ? "tambah" : "kurangi"} ke saldo.`}
              />
              
              <div className="space-y-1.5">
                <label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Catatan Audit</label>
                <input 
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full rounded-sm border border-input bg-background px-3 py-2 font-serif text-base focus:border-primary focus:outline-none"
                  placeholder="Mis. Koreksi selisih manual, penyesuaian akhir bulan..."
                />
              </div>

              {error && (
                <div className="rounded-sm border border-destructive/30 bg-destructive/10 px-3 py-2 font-serif text-sm text-destructive">
                  {error}
                </div>
              )}
              
              <div className="rounded-sm border border-blue-500/30 bg-blue-500/10 px-3 py-2 font-serif text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                Tindakan ini akan membuat rekaman transaksi teknis baru (Penyesuaian Sistem) untuk menyeimbangkan riwayat *ledger* akun Anda.
              </div>
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
                disabled={isPending || !amount || parseFloat(amount) <= 0}
                className="rounded-sm px-4 py-2 bg-foreground font-sans text-sm font-bold text-background shadow-xs hover:bg-foreground/90 transition-colors uppercase tracking-wider disabled:opacity-50 flex items-center gap-2"
              >
                {isPending ? (
                  <>
                    <motion.div 
                      animate={{ rotate: 360 }} 
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="h-3 w-3 border-2 border-background border-t-transparent rounded-full" 
                    />
                    Menyimpan...
                  </>
                ) : (
                  "Terapkan Koreksi"
                )}
              </button>
            </div>
          </motion.form>
        </div>
      )}
    </AnimatePresence>
  )
}
