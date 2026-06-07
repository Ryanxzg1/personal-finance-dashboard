"use client"

import { useMemo } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

interface Transaction {
  amount: number
  category: string
}

interface CategoryDistributionProps {
  transactions: Transaction[]
}

const COLORS = [
  "#a67c52", // primary
  "#b54a35", // destructive/accent
  "#5a6b3b", // income green
  "#7d6b56", // muted foreground
  "#d4c8aa", // accent
  "#8d6e4c", // chart-2
  "#c0a080", // primary-light
]

export function CategoryDistribution({ transactions }: CategoryDistributionProps) {
  const { data, totalExpense, topCategory } = useMemo(() => {
    const expenseOnly = transactions.filter((t) => t.amount < 0)
    const categoryMap: Record<string, { amount: number; count: number }> = {}

    let total = 0
    expenseOnly.forEach((t) => {
      const absAmount = Math.abs(t.amount)
      if (!categoryMap[t.category]) {
        categoryMap[t.category] = { amount: 0, count: 0 }
      }
      categoryMap[t.category].amount += absAmount
      categoryMap[t.category].count += 1
      total += absAmount
    })

    const chartData = Object.entries(categoryMap)
      .map(([name, info]) => ({ 
        name, 
        value: info.amount,
        count: info.count,
        percentage: total > 0 ? (info.amount / total) * 100 : 0
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)

    return { 
      data: chartData, 
      totalExpense: total,
      topCategory: chartData[0] || null
    }
  }, [transactions])

  if (data.length === 0) {
    return (
      <section className="flex h-full min-h-[300px] min-w-0 flex-col items-center justify-center rounded-sm border border-border bg-card p-6 shadow-xs">
        <div className="text-center">
          <p className="font-mono text-sm uppercase tracking-widest text-muted-foreground">Analisis Kategori</p>
          <p className="mt-2 font-serif text-base italic text-muted-foreground">Belum ada data pengeluaran bulan ini.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="flex min-w-0 flex-col rounded-sm border border-border bg-card p-6 shadow-xs">
      <div className="mb-4">
        <h3 className="font-sans text-sm font-bold uppercase tracking-[0.1em] text-foreground">
          Alokasi Pengeluaran
        </h3>
        <p className="font-serif text-sm italic text-muted-foreground">
          Mana yang paling menguras kantong Anda?
        </p>
      </div>

      <div className="relative h-[200px] min-w-0 w-full">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={90}
              paddingAngle={4}
              dataKey="value"
              animationDuration={1000}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" className="outline-hidden" />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="rounded-sm border border-border bg-card p-2 shadow-md">
                      <p className="font-mono text-xs uppercase text-muted-foreground">{d.name}</p>
                      <p className="font-sans text-sm font-bold text-foreground">Rp {d.value.toLocaleString("id-ID")}</p>
                      <div className="mt-1 flex justify-between gap-4 font-mono text-xs">
                        <span className="text-[#5a6b3b]">{d.percentage.toFixed(1)}%</span>
                        <span className="text-muted-foreground">{d.count} Transaksi</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Total</span>
          <span className="font-sans text-xl font-bold tracking-tight text-foreground">
            {totalExpense >= 1000000 ? `${(totalExpense/1000000).toFixed(1)}M` : `Rp ${(totalExpense/1000).toFixed(0)}k`}
          </span>
        </div>
      </div>

      {/* Legend Custom */}
      <div className="mt-4 space-y-2.5">
        {data.map((entry, index) => (
          <div key={entry.name} className="flex flex-col gap-1 group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="font-mono text-sm uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">
                  {entry.name}
                </span>
                <span className="font-serif text-xs italic text-muted-foreground/40 lowercase">
                  ({entry.count}x)
                </span>
              </div>
              <span className="font-sans text-sm font-bold text-foreground">
                Rp {entry.value.toLocaleString("id-ID")}
              </span>
            </div>
            {/* Progress bar mini for visual weight */}
            <div className="h-[2px] w-full bg-muted/30 overflow-hidden rounded-full">
              <div 
                className="h-full transition-all duration-1000" 
                style={{ 
                  backgroundColor: COLORS[index % COLORS.length], 
                  width: `${entry.percentage}%`,
                  opacity: 0.6
                }} 
              />
            </div>
          </div>
        ))}
      </div>

      {/* Spotlight Insight */}
      {topCategory && (
        <div className="mt-6 rounded-sm border border-dashed border-border p-2.5 bg-muted/5">
          <p className="font-serif text-sm italic text-muted-foreground text-center line-height-relaxed">
            Pengeluaran terbanyak ada pada kategori <span className="font-bold text-foreground not-italic">{topCategory.name}</span> dengan total <span className="text-destructive font-sans font-bold not-italic">Rp {topCategory.value.toLocaleString("id-ID")}</span>.
          </p>
        </div>
      )}
    </section>
  )
}
