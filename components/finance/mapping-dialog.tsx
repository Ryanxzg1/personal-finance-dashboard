"use client"

import * as React from "react"
import { useTransition } from "react"
import { Compass, Calendar as CalendarIcon, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createMappingPlan } from "@/lib/actions/mapping"
import { toast } from "sonner"

export function MappingDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const [isPending, startTransition] = useTransition()
  const [name, setName] = React.useState("")
  const [startDate, setStartDate] = React.useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return

    startTransition(async () => {
      const res = await createMappingPlan({
        name,
        startDate: startDate ? new Date(startDate) : undefined,
      })

      if (res.success) {
        toast.success("Rencana berhasil dibuat")
        setOpen(false)
        setName("")
        setStartDate("")
      } else {
        toast.error(res.error || "Gagal membuat rencana")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-sm border-border bg-card">
        <DialogHeader>
          <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-primary/10 mb-4">
            <Compass className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="font-sans text-2xl font-bold">Buat Pemetaan Baru</DialogTitle>
          <p className="font-serif text-sm text-muted-foreground italic">Tentukan nama dan periode pemetaan pengeluaran Anda.</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-1.5">
            <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Nama Rencana</label>
            <Input 
              placeholder="Contoh: Rencana Hidup Agustus 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-sm border-border bg-muted/30 font-serif focus:bg-background"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Mulai Dari (Opsional)</label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-sm border-border bg-muted/30 font-serif pl-10 focus:bg-background"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="flex-1 rounded-sm font-sans"
            >
              Batal
            </Button>
            <Button 
              type="submit" 
              disabled={isPending || !name}
              className="flex-1 rounded-sm font-sans font-bold"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buat Rencana"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
