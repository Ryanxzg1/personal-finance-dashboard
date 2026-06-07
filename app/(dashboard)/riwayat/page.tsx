import { getTransactions } from "@/lib/actions/transactions";
import { getCategories } from "@/lib/actions/categories";
import { getAccounts } from "@/lib/actions/accounts";
import { Metadata } from "next";
import { Transaction } from "@/lib/db/schema";

export const metadata: Metadata = {
  title: "Riwayat Transaksi",
};
import { HistoryTransactionsClient } from "@components/finance/transactions/history-transactions-client";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const [transactionsResult, categoriesResult, accountsResult] = await Promise.all([
    getTransactions(),
    getCategories(),
    getAccounts(),
  ])

  if (!transactionsResult.success) {
    return (
      <div className="p-4 lg:p-8">
        <p className="font-serif text-sm text-destructive">Gagal memuat riwayat transaksi.</p>
      </div>
    )
  }

  if (!categoriesResult.success || !accountsResult.success) {
    return (
      <div className="p-4 lg:p-8">
        <p className="font-serif text-sm text-destructive">Gagal memuat data pendukung untuk edit transaksi.</p>
      </div>
    )
  }

  const transactions = (transactionsResult.data as Transaction[])
    .map((tx) => {
      const d = new Date(tx.date)
      const formattedDate = `${String(d.getDate()).padStart(2, "0")} ${d.toLocaleString("id-ID", {
        month: "short",
      })}`.replace(".", "")

      return {
        id: tx.id.toString(),
        date: formattedDate,
        rawDate: d.toISOString(),
        type: (tx.type === "income" ? "Pemasukan" : "Pengeluaran") as "Pemasukan" | "Pengeluaran",
        category: tx.category,
        note: tx.description,
        amount: tx.type === "income" ? Math.abs(Number(tx.amount)) : -Math.abs(Number(tx.amount)),
        accountId: tx.accountId ?? undefined,
      };
    })
    .filter((t) => {
      const isTechnical = t.category.startsWith("Transfer") ||
        t.category === "Saldo Awal" ||
        t.category === "Penyesuaian Saldo"
      return !isTechnical
    })

  return (
    <div className="p-4 lg:p-8">
      <header className="mb-8">
        <h2 className="font-sans text-xl font-bold tracking-tight">Riwayat Transaksi</h2>
        <p className="font-serif text-sm italic text-muted-foreground">Semua catatan pengeluaran dan pemasukan Anda.</p>
      </header>
      
      <HistoryTransactionsClient
        transactions={transactions}
        categories={categoriesResult.data ?? []}
        accounts={accountsResult.data ?? []}
      />
    </div>
  )
}
