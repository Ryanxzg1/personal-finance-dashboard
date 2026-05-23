"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Target, Wallet, Plus, Pencil, Trash2, Calendar, Trophy, AlertCircle, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SavingsGoalDialog } from "./savings-goal-dialog"
import { createSavingsGoal, updateSavingsGoal, deleteSavingsGoal } from "@/lib/actions/savings"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
export interface SavingsGoal {
  id: number
  userId: string
  name: string
  targetAmount: string
  currentAmount: string
  monthlyTarget: string | null
  deadline: Date | null
}

interface SavingsClientProps {
  initialGoals: SavingsGoal[]
}

export function SavingsClient({ initialGoals }: SavingsClientProps) {
  const [goals, setGoals] = useState(initialGoals)
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null)

  const handleAddClick = () => {
    setEditingGoal(null)
    setDialogOpen(true)
  }

  const handleEditClick = (goal: SavingsGoal) => {
    setEditingGoal(goal)
    setDialogOpen(true)
  }

  const handleDeleteClick = async (id: number) => {
    if (!confirm("Hapus target tabungan ini?")) return
    startTransition(async () => {
      const result = await deleteSavingsGoal(id)
      if (result.success) {
        toast.success("Target dihapus")
      } else {
        toast.error(result.error || "Gagal menghapus")
      }
    })
  }

  const handleSubmit = async (data: any) => {
    startTransition(async () => {
      let result
      if (editingGoal) {
        result = await updateSavingsGoal(editingGoal.id, data)
      } else {
        result = await createSavingsGoal(data)
      }

      if (result.success) {
        toast.success(editingGoal ? "Target diperbarui" : "Target baru dibuat")
        setDialogOpen(false)
        router.refresh()
      } else {
        toast.error(result.error || "Gagal menyimpan")
      }
    })
  }

  return (
    <div className="p-4 lg:p-8">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-sans text-xl font-bold tracking-tight">Tabungan Berencana</h2>
            <p className="font-serif text-sm italic text-muted-foreground">
              "Sedikit demi sedikit, lama-lama menjadi bukit."
            </p>
          </div>
          <Button 
            onClick={handleAddClick}
            className="rounded-sm bg-primary px-6 font-sans text-xs font-bold uppercase tracking-widest shadow-xs hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Target Baru
          </Button>
        </div>
      </header>

      {initialGoals.length === 0 ? (
        <div className="relative">
          <div className="flex flex-col items-center justify-center py-20 rounded-sm border border-dashed border-border bg-card/50 relative z-10">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Target className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-sans text-lg font-bold">Mulai Menabung untuk Impian Anda</h3>
            <p className="mt-2 max-w-md text-center font-serif text-sm text-muted-foreground">
              Belum ada target tabungan. Klik tombol "Target Baru" untuk mencatat rencana menabung Anda.
            </p>
            <Button variant="outline" onClick={handleAddClick} className="mt-6 font-mono text-[10px] uppercase tracking-widest shadow-xs">
              Buat Target Pertama
            </Button>
          </div>

          {/* Sample Background Placeholders */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-30 grayscale pointer-events-none select-none">
            {[
              { name: "Beli MacBook Pro", target: 25000000, current: 15000000, icon: "💻", percent: 60 },
              { name: "Dana Darurat", target: 50000000, current: 12500000, icon: "🏥", percent: 25 },
              { name: "Liburan ke Jepang", target: 15000000, current: 15000000, icon: "✈️", percent: 100 },
            ].map((sample, i) => (
              <div key={i} className="rounded-sm border border-border bg-card p-6 shadow-xs">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-primary/10 text-primary">
                    <Target className="h-6 w-6" />
                  </div>
                  <span className="font-mono text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-wider bg-muted text-muted-foreground">
                    {sample.percent}% Contoh
                  </span>
                </div>
                <h4 className="font-sans text-lg font-bold truncate">{sample.name}</h4>
                <div className="mt-5 space-y-3">
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-muted-foreground/30" style={{ width: `${sample.percent}%` }} />
                  </div>
                  <div className="flex justify-between font-mono text-[11px] uppercase text-muted-foreground">
                    <span>Rp {sample.current.toLocaleString()}</span>
                    <span>Rp {sample.target.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
          {initialGoals.map((goal) => {
            const target = parseFloat(goal.targetAmount)
            const current = parseFloat(goal.currentAmount)
            const monthly = goal.monthlyTarget ? parseFloat(goal.monthlyTarget) : 0
            const percent = Math.min(Math.round((current / target) * 100), 100)
            const isCompleted = current >= target

            // Perhitungan Estimasi
            const remaining = target - current
            const monthsRemaining = monthly > 0 && remaining > 0 ? Math.ceil(remaining / monthly) : null
            
            let estimationText = ""
            if (monthsRemaining !== null) {
              const d = new Date()
              d.setMonth(d.getMonth() + monthsRemaining)
              const monthName = d.toLocaleString("id-ID", { month: "long" })
              estimationText = `${monthsRemaining} bulan lagi (${monthName} ${d.getFullYear()})`
            }

            return (
              <motion.div 
                key={goal.id} 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="group relative rounded-sm border border-border bg-card p-6 shadow-xs transition-all hover:shadow-md"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-primary/10 text-primary">
                    {isCompleted ? <Trophy className="h-6 w-6" /> : <Target className="h-6 w-6" />}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={cn(
                      "font-mono text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-wider",
                      isCompleted ? "bg-[#5a6b3b]/10 text-[#5a6b3b]" : "bg-primary/10 text-primary"
                    )}>
                      {percent}% Selesai
                    </span>
                    {goal.deadline && (
                      <span className="font-mono text-[9px] text-muted-foreground uppercase flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(goal.deadline).toLocaleDateString("id-ID", { month: "short", year: "numeric" })}
                      </span>
                    )}
                  </div>
                </div>

                <h4 className="font-sans text-lg font-bold truncate">{goal.name}</h4>
                
                <div className="mt-5 space-y-3">
                  <div className="flex justify-between font-mono text-[11px] uppercase">
                    <span className="text-muted-foreground text-[10px]">Terkumpul</span>
                    <span className="font-bold">Rp {current.toLocaleString("id-ID")}</span>
                  </div>
                  
                  <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted">
                    <div 
                      className={cn(
                        "h-full transition-all duration-1000 ease-out",
                        isCompleted ? "bg-[#5a6b3b]" : "bg-primary"
                      )} 
                      style={{ width: `${percent}%` }} 
                    />
                  </div>

                  <div className="flex justify-between font-mono text-[11px] uppercase">
                    <span className="text-muted-foreground text-[10px]">Target</span>
                    <span className="text-muted-foreground">Rp {target.toLocaleString("id-ID")}</span>
                  </div>
                </div>

                {!isCompleted && monthly > 0 && (
                  <div className="mt-5 pt-4 border-t border-dashed border-border flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Sisa Kekurangan</span>
                      <span className="font-mono text-xs font-bold text-destructive">
                        Rp {remaining.toLocaleString("id-ID")}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Tabungan/Bulan</span>
                      <span className="font-mono text-xs font-bold text-[#5a6b3b]">Rp {monthly.toLocaleString("id-ID")}</span>
                    </div>

                    {goal.deadline && (
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Target Selesai</span>
                        <span className="font-mono text-xs font-bold text-foreground">
                          {new Date(goal.deadline).toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 rounded-sm px-3 py-2 border bg-primary/5 text-primary border-primary/10 transition-colors">
                      <TrendingUp className="h-4 w-4" />
                      <div className="flex flex-col">
                        <span className="font-mono text-[9px] uppercase tracking-tighter opacity-70">Estimasi Selesai</span>
                        <span className="font-sans text-[11px] font-bold leading-tight">{estimationText}</span>
                      </div>
                    </div>
                  </div>
                )}

                {isCompleted && (
                  <div className="mt-4 flex items-center gap-2 rounded-sm bg-[#5a6b3b]/5 px-3 py-2 text-[#5a6b3b]">
                    <Trophy className="h-4 w-4" />
                    <span className="font-serif text-[11px] italic font-bold tracking-tight">Impian Tercapai!</span>
                  </div>
                )}

                {/* Hover Actions */}
                <div className="absolute right-3 bottom-3 flex items-center gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditClick(goal);
                    }}
                    className="p-2.5 rounded-sm bg-muted text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                  >
                    <Pencil className="h-4.5 w-4.5" />
                  </button>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(goal.id);
                    }}
                    className="p-2.5 rounded-sm bg-muted text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                </div>
              </motion.div>
            )
          })}
          </AnimatePresence>
        </div>
      )}

      <SavingsGoalDialog
        open={dialogOpen}
        initialData={editingGoal}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
