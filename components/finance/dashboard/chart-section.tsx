"use client"

import { useMemo, useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { cn } from "@/lib/utils"

interface Transaction {
  date: string
  amount: number
  type: string
  rawDate: string
}

interface ChartSectionProps {
  transactions: Transaction[]
}

type RangeType = "7D" | "1M" | "3M" | "1Y"

export function ChartSection({ transactions }: ChartSectionProps) {
  const [range, setRange] = useState<RangeType>("7D")

  const data = useMemo(() => {
    let points: { name: string; dateStart: Date; dateEnd: Date }[] = []

    if (range === "7D") {
      points = Array.from({ length: 7 }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (6 - i))
        d.setHours(0, 0, 0, 0)
        const next = new Date(d)
        next.setDate(next.getDate() + 1)
        return { 
          name: d.toLocaleDateString("id-ID", { weekday: "short" }),
          dateStart: d,
          dateEnd: next
        }
      })
    } else if (range === "1M") {
      // Group by weeks (last 4 weeks)
      points = Array.from({ length: 4 }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (28 - (i * 7)))
        d.setHours(0, 0, 0, 0)
        const next = new Date(d)
        next.setDate(next.getDate() + 7)
        return { 
          name: `Minggu ${i + 1}`,
          dateStart: d,
          dateEnd: next
        }
      })
    } else if (range === "3M") {
       // Group by last 3 months
       points = Array.from({ length: 3 }, (_, i) => {
        const d = new Date()
        d.setMonth(d.getMonth() - (2 - i))
        d.setDate(1)
        d.setHours(0, 0, 0, 0)
        const next = new Date(d)
        next.setMonth(next.getMonth() + 1)
        return { 
          name: d.toLocaleDateString("id-ID", { month: "short" }),
          dateStart: d,
          dateEnd: next
        }
      })
    } else if (range === "1Y") {
       // Group by last 12 months
       points = Array.from({ length: 12 }, (_, i) => {
        const d = new Date()
        d.setMonth(d.getMonth() - (11 - i))
        d.setDate(1)
        d.setHours(0, 0, 0, 0)
        const next = new Date(d)
        next.setMonth(next.getMonth() + 1)
        return { 
          name: d.toLocaleDateString("id-ID", { month: "short" }),
          dateStart: d,
          dateEnd: next
        }
      })
    }

    return points.map(p => {
       const pTxs = transactions.filter(t => {
          const d = new Date(t.rawDate)
          return d >= p.dateStart && d < p.dateEnd
       })
       const income = pTxs.filter(t => t.amount > 0).reduce((sum, t) => sum + Number(t.amount), 0)
       const expense = pTxs.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)
       return {
         name: p.name,
         pemasukan: income,
         pengeluaran: expense
       }
    })
  }, [transactions, range])

  const ranges: { id: RangeType; label: string }[] = [
    { id: "7D", label: "7 Hari" },
    { id: "1M", label: "1 Bulan" },
    { id: "3M", label: "3 Bulan" },
    { id: "1Y", label: "1 Tahun" },
  ]

  return (
    <section className="rounded-sm border border-border bg-card p-3 sm:p-6 shadow-xs">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="font-sans text-sm font-bold uppercase tracking-[0.1em] text-foreground">
            Tren Keuangan
          </h3>
          <p className="font-serif text-[13px] italic text-muted-foreground">
            Perbandingan arus kas berdasarkan periode pilihan.
          </p>
        </div>

        <div className="grid w-full grid-cols-4 gap-1 rounded-sm bg-muted p-1 sm:w-auto">
          {ranges.map((r) => (
            <button
              key={r.id}
              onClick={() => setRange(r.id)}
              className={cn(
                "rounded-[2px] px-2 py-2 text-center font-mono text-[11px] font-bold uppercase tracking-wider transition-all sm:px-3 sm:py-1",
                range === r.id 
                  ? "bg-card text-foreground shadow-sm ring-1 ring-border/50" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 0, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fontFamily: 'var(--font-mono)', fill: 'var(--muted-foreground)' }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fontFamily: 'var(--font-mono)', fill: 'var(--muted-foreground)' }}
              tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}
            />
            <Tooltip 
              cursor={{ fill: 'var(--muted)', fillOpacity: 0.4 }}
              formatter={(value: any) => `Rp ${Number(value).toLocaleString("id-ID")}`}
              contentStyle={{ 
                backgroundColor: 'var(--card)', 
                border: '1px solid var(--border)',
                borderRadius: '4px',
                fontSize: '13px',
                fontFamily: 'var(--font-serif)',
                padding: '12px'
              }}
            />
            <Bar 
              dataKey="pemasukan" 
              fill="#5a6b3b" 
              radius={[0, 0, 0, 0]} 
              barSize={range === "1Y" ? 16 : 24} 
              stackId="a" 
            />
            <Bar 
              dataKey="pengeluaran" 
              fill="var(--destructive)" 
              radius={[4, 4, 0, 0]} 
              barSize={range === "1Y" ? 16 : 24} 
              stackId="a" 
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex items-center justify-center gap-6 border-t border-dashed border-border pt-4">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-[#5a6b3b]" />
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Pemasukan</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-destructive" />
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Pengeluaran</span>
        </div>
      </div>
    </section>
  )
}
