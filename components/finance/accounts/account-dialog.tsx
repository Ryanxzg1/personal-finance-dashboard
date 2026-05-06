"use client"

import { useEffect, useState } from "react"
import { X, Landmark, Banknote, Wallet, CreditCard } from "lucide-react"
import { AmountInput } from "@/components/ui/amount-input"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface AccountDialogProps {
  open: boolean
  initialData?: { id: number; name: string; type: string; initialBalance: string }
  onClose: () => void
  onSubmit: (data: { name: string; type: string; initialBalance: string }) => void
  isPending?: boolean
}

export function AccountDialog({ open, initialData, onClose, onSubmit, isPending }: AccountDialogProps) {
  const [name, setName] = useState("")
  const [type, setType] = useState("bank")
  const [initialBalance, setInitialBalance] = useState("0")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      if (initialData) {
        setName(initialData.name)
        setType(initialData.type)
        setInitialBalance(parseFloat(initialData.initialBalance).toString())
      } else {
        setName("")
        setType("bank")
        setInitialBalance("0")
      }
      setError(null)
    }
  }, [open, initialData])

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError("Nama dompet wajib diisi.")
      return
    }
    onSubmit({
      name: name.trim(),
      type,
      initialBalance: initialBalance || "0"
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
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Sunting Dompet
                </p>
                <h2 className="mt-1 font-sans text-xl font-bold tracking-tight">
                  Edit {initialData?.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-sm p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 flex flex-col gap-5">
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Nama Dompet</label>
                <input 
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-sm border border-input bg-background px-3 py-2 font-serif text-sm focus:border-primary focus:outline-none"
                  placeholder="Mis. BCA, GoPay..."
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Jenis Dompet</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "bank", label: "Bank", icon: Landmark },
                    { id: "cash", label: "Tunai", icon: Banknote },
                    { id: "e-wallet", label: "E-Wallet", icon: Wallet },
                    { id: "credit_card", label: "Kartu Kredit", icon: CreditCard },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setType(item.id)}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-sm border font-mono text-[10px] uppercase tracking-wider transition-colors",
                        type === item.id 
                          ? "border-primary bg-primary/5 text-primary font-bold" 
                          : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-3.5 w-3.5" />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <AmountInput 
                label="Saldo Saat Ini (Rp)"
                value={initialBalance}
                onChange={setInitialBalance}
                helperText="Mengubah saldo awal akan menggeser saldo total Anda saat ini."
              />

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
                disabled={isPending}
                className="rounded-sm px-4 py-2 bg-primary font-sans text-sm font-bold text-white shadow-xs hover:bg-primary/90 transition-colors uppercase tracking-wider disabled:opacity-50 flex items-center gap-2"
              >
                {isPending ? (
                  <>
                    <motion.div 
                      animate={{ rotate: 360 }} 
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="h-3 w-3 border-2 border-white border-t-transparent rounded-full" 
                    />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Perubahan"
                )}
              </button>
            </div>
          </motion.form>
        </div>
      )}
    </AnimatePresence>
  )
}
