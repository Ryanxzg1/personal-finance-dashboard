"use client"

import { useState, useTransition } from "react"
import { ArrowLeft, Plus, Trash2, Calculator, CheckCircle2, LayoutList } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { addMappingItem, deleteMappingItem } from "@/lib/actions/mapping"
import { AmountInput } from "@/components/ui/amount-input"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface MappingItem {
  id: number
  description: string
  amount: string
  isEssential: boolean | null
}

interface MappingPlan {
  id: number
  name: string
  startDate: Date | null
  items: MappingItem[]
}

export function MappingDetailClient({ plan }: { plan: MappingPlan }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  
  // Form State for New Item
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [isEssential, setIsEssential] = useState(false)

  const totalBudget = plan.items.reduce((acc, item) => acc + parseFloat(item.amount), 0)
  const essentialBudget = plan.items.filter(i => i.isEssential).reduce((acc, item) => acc + parseFloat(item.amount), 0)
  const nonEssentialBudget = totalBudget - essentialBudget

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description || !amount) return

    startTransition(async () => {
      const res = await addMappingItem({
        planId: plan.id,
        description,
        amount,
        isEssential,
      })

      if (res.success) {
        setDescription("")
        setAmount("")
        setIsEssential(false)
        router.refresh()
        toast.success("Item rencana ditambahkan")
      }
    })
  }

  const handleDeleteItem = async (id: number) => {
    startTransition(async () => {
      const res = await deleteMappingItem(id)
      if (res.success) {
        router.refresh()
        toast.success("Item dihapus")
      }
    })
  }

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Navigation */}
      <Button 
        variant="ghost" 
        onClick={() => router.push("/pemetaan")}
        className="group gap-2 pl-0 hover:bg-transparent"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        <span className="font-mono text-[10px] uppercase tracking-widest">Kembali ke Daftar</span>
      </Button>

      {/* Header Card */}
      <div className="bg-card border border-border p-8 rounded-sm shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Calculator className="h-24 w-24" />
        </div>
        <div className="relative z-10">
          <h2 className="font-sans text-3xl font-bold tracking-tight mb-2">{plan.name}</h2>
          <div className="flex items-center gap-4 text-muted-foreground">
             <div className="flex items-center gap-1">
               <span className="font-mono text-[10px] uppercase tracking-wider">Total Rencana:</span>
               <span className="font-sans font-bold text-foreground">Rp {totalBudget.toLocaleString("id-ID")}</span>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Input Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card border border-border p-6 rounded-sm shadow-xs">
            <h3 className="font-sans font-bold mb-4 flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              Tambah Kebutuhan
            </h3>
            
            <form onSubmit={handleAddItem} className="space-y-4">
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Deskripsi Kebutuhan</label>
                <input 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Contoh: Belanja Bulanan"
                  className="w-full rounded-sm border border-border bg-muted/30 px-3 py-2 font-serif text-sm focus:bg-background outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <AmountInput 
                label="Estimasi Biaya"
                value={amount}
                onChange={setAmount}
              />

              <div className="flex items-center gap-3 py-2">
                 <button
                   type="button"
                   onClick={() => setIsEssential(!isEssential)}
                   className={cn(
                     "flex h-5 w-5 items-center justify-center rounded-sm border transition-colors",
                     isEssential ? "bg-primary border-primary text-white" : "border-border hover:border-primary/50"
                   )}
                 >
                   {isEssential && <CheckCircle2 className="h-3 w-3" />}
                 </button>
                 <span className="font-serif text-sm italic">Kebutuhan Pokok (Wajib)</span>
              </div>

              <Button type="submit" disabled={isPending || !description || !amount} className="w-full rounded-sm font-sans font-bold">
                {isPending ? "Menyimpan..." : "Tambahkan ke Rencana"}
              </Button>
            </form>
          </div>

          {/* Quick Analytics */}
          <div className="bg-[#5a6b3b]/5 border border-[#5a6b3b]/10 p-6 rounded-sm">
             <h4 className="font-mono text-[11px] uppercase tracking-widest text-[#5a6b3b] mb-4">Analisis Pemetaan</h4>
             <div className="space-y-4">
               <div className="flex justify-between items-center text-sm sm:text-base font-serif">
                 <span className="opacity-70">Wajib Dipenuhi:</span>
                 <span className="font-bold text-[#5a6b3b]">Rp {essentialBudget.toLocaleString("id-ID")}</span>
               </div>
               <div className="flex justify-between items-center text-sm sm:text-base font-serif">
                 <span className="opacity-70">Keinginan/Lainnya:</span>
                 <span className="font-bold">Rp {nonEssentialBudget.toLocaleString("id-ID")}</span>
               </div>
             </div>
          </div>
        </div>

        {/* Right: Items List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <LayoutList className="h-4 w-4" />
              Daftar Pemetaan Pengeluaran ({plan.items.length})
            </h3>
          </div>

          <div className="space-y-3">
            {plan.items.length === 0 ? (
              <div className="py-20 text-center border border-dashed border-border rounded-sm bg-muted/20">
                <p className="font-serif text-muted-foreground italic">Daftar masih kosong. Mulai susun rencana Anda di sebelah kiri.</p>
              </div>
            ) : (
              plan.items.map((item) => (
                <div key={item.id} className="group flex items-center justify-between bg-card border border-border p-4 rounded-sm hover:border-primary/30 transition-colors shadow-xs">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "h-2 w-2 rounded-full",
                      item.isEssential ? "bg-[#5a6b3b]" : "bg-primary/40"
                    )} />
                    <div className="flex flex-col">
                      <span className="font-sans font-bold">{item.description}</span>
                      {item.isEssential && (
                        <span className="font-mono text-[8px] text-[#5a6b3b] uppercase tracking-tighter font-bold">Wajib</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <span className="font-mono text-sm font-bold">Rp {parseFloat(item.amount).toLocaleString("id-ID")}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDeleteItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
