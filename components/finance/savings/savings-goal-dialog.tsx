"use client"

import { useEffect, useState } from "react"
import { X, TrendingUp } from "lucide-react"
import { AmountInput } from "@/components/ui/amount-input"

interface SavingsGoalDialogProps {
  open: boolean
  initialData?: {
    name: string
    targetAmount: string
    currentAmount: string
    monthlyTarget: string | null
    deadline: Date | null
  }
  onClose: () => void
  onSubmit: (data: {
    name: string
    targetAmount: string
    currentAmount: string
    monthlyTarget: string
    deadline: string
    icon: string
  }) => void
}

export function SavingsGoalDialog({ open, initialData, onClose, onSubmit }: SavingsGoalDialogProps) {
  const [name, setName] = useState("")
  const [targetAmount, setTargetAmount] = useState("")
  const [currentAmount, setCurrentAmount] = useState("0")
  const [duration, setDuration] = useState("") // Baru: Target Durasi dalam bulan
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      if (initialData) {
        setName(initialData.name)
        setTargetAmount(parseFloat(initialData.targetAmount).toString())
        setCurrentAmount(parseFloat(initialData.currentAmount).toString())
        
        // Estimasi durasi dari data yang ada jika ada deadline
        if (initialData.deadline) {
          const start = new Date()
          const end = new Date(initialData.deadline)
          const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
          setDuration(Math.max(1, months).toString())
        } else if (initialData.monthlyTarget && parseFloat(initialData.targetAmount) > 0) {
           const remaining = parseFloat(initialData.targetAmount) - parseFloat(initialData.currentAmount)
           const months = Math.ceil(remaining / parseFloat(initialData.monthlyTarget))
           setDuration(months.toString())
        }
      } else {
        setName("")
        setTargetAmount("")
        setCurrentAmount("0")
        setDuration("12") // Default 1 tahun
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

    const target = parseFloat(targetAmount)
    const current = parseFloat(currentAmount) || 0
    const dur = parseInt(duration) || 1
    const calculatedMonthly = Math.ceil((target - current) / dur).toString()
    
    // Hitung deadline (bulan depan * durasi)
    const deadlineDate = new Date()
    deadlineDate.setMonth(deadlineDate.getMonth() + dur)
    
    onSubmit({
      name: name.trim(),
      targetAmount,
      currentAmount: currentAmount || "0",
      monthlyTarget: calculatedMonthly,
      deadline: deadlineDate.toISOString(),
      icon: "🎯",
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

          <div className="space-y-1.5">
            <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Target Durasi (Bulan)</label>
            <div className="flex items-center gap-3">
               <input 
                 type="number"
                 min="1"
                 value={duration}
                 onChange={(e) => setDuration(e.target.value)}
                 className="w-full rounded-sm border border-input bg-background px-3 py-2 font-serif text-sm focus:border-primary focus:outline-none"
                 placeholder="Mis. 12"
               />
               <span className="font-serif text-sm text-muted-foreground whitespace-nowrap">Bulan</span>
            </div>
          </div>

          <div className="rounded-sm bg-muted/50 p-4 border border-border border-dashed">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="font-sans text-[11px] font-bold uppercase tracking-widest text-foreground">Ringkasan Rencana</span>
            </div>
            <div className="space-y-2">
              <p className="font-serif text-[12px] text-muted-foreground leading-relaxed">
                {targetAmount && parseFloat(targetAmount) > 0 ? (
                  <>
                    Untuk mencapai impian dalam <span className="font-bold text-primary underline underline-offset-4">{duration || 1} bulan</span>, 
                    Anda perlu mengalokasikan tabungan sebesar <span className="font-bold text-foreground">
                      Rp {Math.ceil((parseFloat(targetAmount) - (parseFloat(currentAmount) || 0)) / (parseInt(duration) || 1)).toLocaleString("id-ID")}
                    </span> per bulan.
                  </>
                ) : (
                  "Masukkan target jumlah dan durasi untuk melihat ringkasan rencana menabung Anda."
                )}
              </p>
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
