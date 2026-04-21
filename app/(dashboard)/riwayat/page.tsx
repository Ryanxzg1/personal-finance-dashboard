import { getTransactions } from "@/lib/actions/transactions";
import { TransactionsTable, type Transaction as UITransaction } from "@/components/finance/transactions-table";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const result = await getTransactions();
  
  let transactions: UITransaction[] = [];
  
  if (result.success && result.data) {
    transactions = result.data.map((tx) => {
      const d = new Date(tx.date);
      const formattedDate = `${String(d.getDate()).padStart(2, "0")} ${d.toLocaleString("id-ID", {
        month: "short",
      })}`.replace(".", "");

      return {
        id: tx.id.toString(),
        date: formattedDate,
        rawDate: d.toISOString(),
        type: tx.type === "income" ? "Pemasukan" : "Pengeluaran",
        category: tx.category,
        note: tx.description,
        amount: Number(tx.amount),
      };
    });
  }

  return (
    <div className="p-8">
      <header className="mb-8">
        <h2 className="font-sans text-xl font-bold tracking-tight">Riwayat Transaksi</h2>
        <p className="font-serif text-sm italic text-muted-foreground">Semua catatan pengeluaran dan pemasukan Anda.</p>
      </header>
      
      <TransactionsTable transactions={transactions} />
    </div>
  );
}
