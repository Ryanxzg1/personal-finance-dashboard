"use client"

import { useEffect, useState } from "react"
import { X, Target, Calendar, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"
import { AmountInput } from "@/components/ui/amount-input"

interface SavingsGoalDialogProps {
  open: boolean
  initialData?: any
  onClose: () => void
  onSubmit: (data: any) => void
}

export function SavingsGoalDialog({ open, initialData, onClose, onSubmit }: SavingsGoalDialogProps) {
  const [name, setName] = useState("")
  const [targetAmount, setTargetAmount] = useState("")
  const [currentAmount, setCurrentAmount] = useState("0")
  const [monthlyTarget, setMonthlyTarget] = useState("")
  const [deadline, setDeadline] = useState("")
  const [icon, setIcon] = useState("🎯")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      if (initialData) {
        setName(initialData.name)
        setTargetAmount(parseFloat(initialData.targetAmount).toString())
        setCurrentAmount(parseFloat(initialData.currentAmount).toString())
        setMonthlyTarget(initialData.monthlyTarget ? parseFloat(initialData.monthlyTarget).toString() : "")
        setDeadline(initialData.deadline ? new Date(initialData.deadline).toISOString().split('T')[0] : "")
        setIcon(initialData.icon || "🎯")
      } else {
        setName("")
        setTargetAmount("")
        setCurrentAmount("0")
        setMonthlyTarget("")
        setDeadline("")
        setIcon("🎯")
      }
      setError(null)
    }
  }, [open, initialData])

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError("Nama target wajib diisi.")
      return
    }
    if (!targetAmount || parseFloat(targetAmount) <= 0) {
      setError("Target jumlah harus lebih dari 0.")
      return
    }
    
    onSubmit({
      name: name.trim(),
      targetAmount,
      currentAmount: currentAmount || "0",
      monthlyTarget: monthlyTarget || null,
      deadline: deadline || null,
      icon,
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
              Tabungan Berencana
            </p>
            <h2 className="mt-1 font-sans text-xl font-bold tracking-tight">
              {initialData ? "Sunting Target" : "Target Impian Baru"}
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
            <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Nama Impian</label>
            <input 
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-sm border border-input bg-background px-3 py-2 font-serif text-sm focus:border-primary focus:outline-none"
              placeholder="Mis. Beli MacBook Air, Dana Darurat..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AmountInput 
              label="Target Jumlah (Rp)"
              value={targetAmount}
              onChange={setTargetAmount}
            />
            <AmountInput 
              label="Tersimpan Saat Ini (Rp)"
              value={currentAmount}
              onChange={setCurrentAmount}
            />
          </div>

          <AmountInput 
            label="Alokasi Nabung per Bulan (Rp)"
            value={monthlyTarget}
            onChange={setMonthlyTarget}
            helperText="Digunakan untuk menghitung estimasi waktu tercapai."
          />

          <div className="space-y-1.5">
            <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Target Tanggal (Opsional)</label>
            <div className="relative">
              <input 
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full rounded-sm border border-input bg-background px-3 py-2 font-serif text-sm focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Ikon</label>
            <div className="flex gap-2">
              {["🎯", "💻", "🏠", "🚗", "✈️", "💍", "🏥", "🎓"].map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIcon(i)}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-sm border text-lg transition-all",
                    icon === i ? "border-primary bg-primary/10" : "border-border bg-background hover:bg-muted"
                  )}
                >
                  {i}
                </button>
              ))}
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
            className="rounded-sm px-4 py-2 bg-primary font-sans text-sm font-bold text-white shadow-xs hover:bg-primary/90 transition-colors uppercase tracking-wider"
          >
            {initialData ? "Simpan Perubahan" : "Mulai Menabung"}
          </button>
        </div>
      </form>
    </div>
  )
}
