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
      <div className="mb-4">
        <h3 className="font-sans text-sm font-bold uppercase tracking-[0.1em] text-foreground">
          Tren Keuangan 7 Hari Terakhir
        </h3>
        <p className="font-serif text-[13px] italic text-muted-foreground">
          Perbandingan arus kas mingguan Anda.
        </p>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 13, fontFamily: 'var(--font-mono)', fill: 'var(--muted-foreground)' }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 13, fontFamily: 'var(--font-mono)', fill: 'var(--muted-foreground)' }}
              tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}
            />
            <Tooltip 
              cursor={{ fill: 'var(--muted)', fillOpacity: 0.4 }}
              contentStyle={{ 
                backgroundColor: 'var(--card)', 
                border: '1px solid var(--border)',
                borderRadius: '4px',
                fontSize: '14px',
                fontFamily: 'var(--font-serif)',
                padding: '12px'
              }}
            />
            <Bar dataKey="pemasukan" fill="#5a6b3b" radius={[4, 4, 0, 0]} barSize={32} />
            <Bar dataKey="pengeluaran" fill="var(--destructive)" radius={[4, 4, 0, 0]} barSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 flex items-center justify-center gap-4 border-t border-dashed border-border pt-4">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-[#5a6b3b]" />
          <span className="font-mono text-[13px] uppercase tracking-wider text-muted-foreground">Pemasukan</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-destructive" />
          <span className="font-mono text-[13px] uppercase tracking-wider text-muted-foreground">Pengeluaran</span>
        </div>
      </div>
    </section>
  )
}
