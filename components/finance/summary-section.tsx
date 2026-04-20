import { ArrowDownRight, ArrowUpRight, TrendingUp, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"

const INCOME = "text-[#5a6b3b]"
const EXPENSE = "text-destructive"

function formatRupiah(value: number) {
  const sign = value < 0 ? "-" : "+"
  const abs = Math.abs(value).toLocaleString("id-ID")
  return `${sign} Rp ${abs}`
}

interface SummaryProps {
  balance: number
  changePct: number
  lastEntries: { amount: number; label: string; date: string }[]
}

export function SummarySection({ balance, changePct, lastEntries }: SummaryProps) {
  const isUp = changePct >= 0
  return (
    <section aria-labelledby="ringkasan-heading" className="flex flex-col gap-4">
      <header className="flex items-baseline justify-between border-b border-border/60 pb-2">
        <h2 id="ringkasan-heading" className="font-sans text-xl font-bold tracking-tight text-foreground">
          Ringkasan Keuangan
        </h2>
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Periode · Okt 2026
        </span>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Total Saldo */}
        <article className="relative overflow-hidden rounded-sm border border-border bg-card p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" aria-hidden="true" />
              <h3 className="font-sans text-sm font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Total Saldo Saat Ini
              </h3>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              IDR
            </span>
          </div>

          <p className="mt-5 font-mono text-3xl font-medium tracking-tight text-foreground lg:text-4xl">
            Rp 5.420.000
          </p>

          <div className="mt-4 flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 font-mono text-xs",
                isUp
                  ? "border-[#5a6b3b]/30 bg-[#5a6b3b]/10 text-[#5a6b3b]"
                  : "border-destructive/30 bg-destructive/10 text-destructive",
              )}
            >
              {isUp ? (
                <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
              ) : (
                <ArrowDownRight className="h-3 w-3" aria-hidden="true" />
              )}
              {isUp ? "+" : ""}
              {changePct.toFixed(1)}%
            </span>
            <span className="font-serif text-xs italic text-muted-foreground">
              dibanding periode sebelumnya
            </span>
          </div>

          <div
            className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full border border-border/60"
            aria-hidden="true"
          />
        </article>

        {/* Input Terakhir */}
        <article className="rounded-sm border border-border bg-card p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" aria-hidden="true" />
              <h3 className="font-sans text-sm font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Input Terakhir
              </h3>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              3 entri
            </span>
          </div>

          <ul className="mt-4 divide-y divide-dashed divide-border/80">
            {lastEntries.map((entry, idx) => {
              const positive = entry.amount >= 0
              return (
                <li key={idx} className="flex items-center justify-between py-3 first:pt-2 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate font-serif text-sm text-foreground">{entry.label}</p>
                    <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                      {entry.date}
                    </p>
                  </div>
                  <span className={cn("font-mono text-sm font-medium", positive ? INCOME : EXPENSE)}>
                    {formatRupiah(entry.amount)}
                  </span>
                </li>
              )
            })}
          </ul>
        </article>
      </div>
    </section>
  )
}
