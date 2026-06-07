"use client"

import { Landmark, Wallet, CreditCard, Banknote, MoreHorizontal, Pencil } from "lucide-react"
import { cn } from "@/lib/utils"

interface Account {
  id: number
  name: string
  type: string
  initialBalance: string
  currentBalance: number
}

interface AccountSummaryProps {
  accounts: Account[]
  onEditAccount?: (acc: Account) => void
}

export function AccountSummary({ accounts, onEditAccount }: AccountSummaryProps) {
  if (accounts.length === 0) return null

  return (
    <div className="rounded-sm border border-border bg-card p-5 shadow-xs h-fit">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-sans text-sm font-bold uppercase tracking-[0.1em] text-foreground">Dompet Saya</h3>
        <button className="text-muted-foreground hover:text-foreground transition-colors">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {accounts.map((acc) => (
          <div 
            key={acc.id} 
            className="group flex items-center justify-between p-3 rounded-sm border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <button 
                onClick={() => onEditAccount?.(acc)}
                className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 p-1 rounded-sm bg-primary/10 text-primary hover:bg-primary/20 transition-all mr-1"
              >
                <Pencil className="h-3 w-3" />
              </button>
              <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-background border border-border">
                {acc.type === "bank" && <Landmark className="h-4 w-4 text-primary" />}
                {acc.type === "cash" && <Banknote className="h-4 w-4 text-[#5a6b3b]" />}
                {acc.type === "e-wallet" && <Wallet className="h-4 w-4 text-orange-500" />}
                {acc.type === "credit_card" && <CreditCard className="h-4 w-4 text-destructive" />}
              </div>
              <div>
                <p className="font-sans text-sm font-bold leading-none">{acc.name}</p>
                <p className="mt-1 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  {acc.type.replace("_", " ")}
                </p>
              </div>
            </div>
            <p className={cn(
              "font-mono text-xs font-bold tabular-nums",
              acc.currentBalance >= 0 ? "text-foreground" : "text-destructive"
            )}>
              {acc.currentBalance < 0 ? "-" : ""}Rp {Math.abs(acc.currentBalance).toLocaleString("id-ID")}
            </p>
          </div>
        ))}
      </div>
      
      <p className="mt-4 font-serif text-xs italic text-muted-foreground text-center">
        Saldo dihitung otomatis dari transaksi terhubung.
      </p>
    </div>
  )
}
