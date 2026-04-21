"use client"

import { useMemo } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"

interface Transaction {
  date: string
  amount: number
  type: string
}

interface ChartSectionProps {
  transactions: Transaction[]
}

export function ChartSection({ transactions }: ChartSectionProps) {
  const data = useMemo(() => {
    // Ambil 7 hari terakhir
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      return d.toISOString().split("T")[0]
    })

    return last7Days.map((dateStr) => {
      const dayTxs = transactions.filter((t) => {
          // Kita asumsikan ada properti rawDate atau kita parse t.date
          // Untuk akurasi, kita harap ada format YYYY-MM-DD
          return (t as any).rawDate?.startsWith(dateStr)
      })

      const income = dayTxs
        .filter((t) => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0)
      const expense = dayTxs
        .filter((t) => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0)

      const d = new Date(dateStr)
      const label = d.toLocaleDateString("id-ID", { weekday: "short" })

      return {
        name: label,
        pemasukan: income,
        pengeluaran: expense,
      }
    })
  }, [transactions])

  return (
    <section className="rounded-sm border border-border bg-card p-6 shadow-xs">
      <div className="mb-6">
        <h3 className="font-sans text-sm font-bold uppercase tracking-wider text-foreground">
          Tren Keuangan 7 Hari Terakhir
        </h3>
        <p className="font-serif text-xs italic text-muted-foreground">
          Perbandingan arus kas mingguan Anda.
        </p>
      </div>

      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip 
              cursor={{ fill: 'hsl(var(--muted)/0.4)' }}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '4px',
                fontSize: '12px',
                fontFamily: 'var(--font-serif)'
              }}
            />
            <Bar dataKey="pemasukan" fill="#5a6b3b" radius={[2, 2, 0, 0]} />
            <Bar dataKey="pengeluaran" fill="hsl(var(--destructive))" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex items-center justify-center gap-4 border-t border-dashed border-border pt-4">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-[#5a6b3b]" />
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Pemasukan</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-destructive" />
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Pengeluaran</span>
        </div>
      </div>
    </section>
  )
}
