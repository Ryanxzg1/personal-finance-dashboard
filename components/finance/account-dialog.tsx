"use client"

import { useEffect, useState } from "react"
import { X, Landmark, Banknote, Wallet, CreditCard } from "lucide-react"
import { AmountInput } from "@/components/ui/amount-input"
import { cn } from "@/lib/utils"

interface AccountDialogProps {
  open: boolean
  initialData?: { id: number; name: string; type: string; initialBalance: string }
  onClose: () => void
  onSubmit: (data: { name: string; type: string; initialBalance: string }) => void
}

export function AccountDialog({ open, initialData, onClose, onSubmit }: AccountDialogProps) {
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
      setError("Nama akun wajib diisi.")
      return
    }
    onSubmit({
      name: name.trim(),
      type,
      initialBalance: initialBalance || "0"
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
        <div className="flex items-start justify-between gap-4 border-b border-dashed border-border pb-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Sunting Akun
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
            <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Nama Akun</label>
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
            <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Jenis Akun</label>
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
            className="rounded-sm px-4 py-2 bg-primary font-sans text-sm font-bold text-white shadow-xs hover:bg-primary/90 transition-colors uppercase tracking-wider"
          >
            Simpan Perubahan
          </button>
        </div>
      </form>
    </div>
  )
}
