"use client"

import { useState, useTransition } from "react"
import { Compass, Plus, Trash2, Calendar, ChevronRight, LayoutList, AlertCircle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { createMappingPlan, deleteMappingPlan } from "@/lib/actions/mapping"
import { useRouter } from "next/navigation"
import { MappingDialog } from "./mapping-dialog"
import { encodeId } from "@/lib/id-codec"

interface MappingPlan {
  id: number
  name: string
  startDate: Date | null
  endDate: Date | null
  createdAt: Date
}

export function MappingClient({ initialPlans }: { initialPlans: MappingPlan[] }) {
  const [isPending, startTransition] = useTransition()
  const [plans, setPlans] = useState(initialPlans)
  const router = useRouter()

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus rencana ini? Semua item di dalamnya akan ikut terhapus.")) return
    
    startTransition(async () => {
      const res = await deleteMappingPlan(id)
      if (res.success) {
        setPlans(plans.filter(p => p.id !== id))
      }
    })
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-sm border border-border shadow-xs">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-sm bg-primary/10 flex items-center justify-center">
            <Compass className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="font-sans text-2xl font-bold tracking-tight">Pemetaan Biaya</h2>
            <p className="font-serif text-sm text-muted-foreground italic">Arsitektur rencana pengeluaran masa depan Anda.</p>
          </div>
        </div>
        <MappingDialog>
          <Button className="rounded-sm font-sans font-bold gap-2">
            <Plus className="h-4 w-4" />
            Buat Rencana Baru
          </Button>
        </MappingDialog>
      </div>

      {/* Info Card */}
      <div className="bg-primary/5 border border-primary/10 p-4 rounded-sm flex gap-3 items-start">
        <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <p className="text-sm font-serif leading-relaxed">
          <strong className="font-sans font-bold">Pemetaan Biaya</strong> digunakan untuk menyusun <strong className="font-sans font-bold">rencana biaya</strong> (seperti biaya pernikahan, renovasi rumah, atau biaya hidup bulanan) sebelum uangnya benar-benar keluar. Ini membantu Anda memetakan kebutuhan dana secara mendetail.
        </p>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center border border-dashed border-border rounded-sm bg-muted/30">
            <LayoutList className="h-12 w-12 text-muted-foreground opacity-20 mb-4" />
            <p className="font-serif text-muted-foreground italic">Belum ada pemetaan yang disusun.</p>
          </div>
        ) : (
          plans.map((plan) => (
            <div 
              key={plan.id}
              onClick={() => router.push(`/pemetaan/${encodeId(plan.id)}`)}
              className="group cursor-pointer bg-card border border-border p-6 rounded-sm shadow-xs transition-all hover:shadow-md hover:border-primary/50 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(plan.id)
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-col h-full justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="font-mono text-[10px] uppercase text-muted-foreground tracking-widest">
                      {plan.startDate ? new Date(plan.startDate).toLocaleDateString("id-ID", { month: "short", year: "numeric" }) : "Tanpa Periode"}
                    </span>
                  </div>
                  <h3 className="font-sans text-xl font-bold group-hover:text-primary transition-colors">{plan.name}</h3>
                </div>

                <div className="mt-8 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-mono text-[9px] uppercase text-muted-foreground">Status</span>
                    <span className="text-xs font-serif italic text-primary">Draf Perencanaan</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
