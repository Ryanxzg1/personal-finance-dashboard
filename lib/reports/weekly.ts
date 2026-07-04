import type { Transaction } from "@/lib/db/schema"

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

export interface WeeklyReportWindow {
  start: Date
  end: Date
}

export interface WeeklyReportStats {
  totalIncome: number
  totalExpense: number
  topCategory: string
  topCategoryAmount: number
}

export function getWeeklyReportWindow(reference = new Date()): WeeklyReportWindow {
  const wibDate = new Date(reference.getTime() + WIB_OFFSET_MS)
  const daysSinceMonday = (wibDate.getUTCDay() + 6) % 7
  const localMidnightAsUtc = Date.UTC(
    wibDate.getUTCFullYear(),
    wibDate.getUTCMonth(),
    wibDate.getUTCDate(),
  )
  const end = new Date(localMidnightAsUtc - daysSinceMonday * 24 * 60 * 60 * 1000 - WIB_OFFSET_MS)

  return { start: new Date(end.getTime() - WEEK_MS), end }
}

export function isReportableTransaction(transaction: Pick<Transaction, "category">) {
  return !transaction.category.startsWith("Transfer")
    && transaction.category !== "Saldo Awal"
    && transaction.category !== "Penyesuaian Saldo"
}

export function summarizeTransactions(items: Transaction[]): WeeklyReportStats {
  let totalIncome = 0
  let totalExpense = 0
  const expenseByCategory = new Map<string, number>()

  for (const transaction of items.filter(isReportableTransaction)) {
    const amount = Number(transaction.amount)
    if (transaction.type === "income") {
      totalIncome += amount
      continue
    }

    totalExpense += amount
    expenseByCategory.set(
      transaction.category,
      (expenseByCategory.get(transaction.category) ?? 0) + amount,
    )
  }

  let topCategory = ""
  let topCategoryAmount = 0
  for (const [category, amount] of expenseByCategory) {
    if (amount > topCategoryAmount) {
      topCategory = category
      topCategoryAmount = amount
    }
  }

  return { totalIncome, totalExpense, topCategory, topCategoryAmount }
}

export function formatWibDate(date: Date, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", ...options }).format(date)
}
