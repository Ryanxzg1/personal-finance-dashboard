import { DashboardClient } from "@/components/finance/dashboard-client";
import { getTransactions } from "@/lib/actions/transactions";
import { getCategories } from "@/lib/actions/categories";
import { getAccounts } from "@/lib/actions/accounts";
import { type Transaction as UITransaction } from "@/components/finance/transactions-table";
import { currentUser } from "@clerk/nextjs/server";
import { getBudgets } from "@/lib/actions/budgets";

export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await currentUser();
  const userName = user?.firstName || "Pengguna";
  const now = new Date();

  // Ambil data dari database
  const [txResult, catResult, budgetResult, accountResult] = await Promise.all([
    getTransactions(),
    getCategories(),
    getBudgets(now.getMonth(), now.getFullYear()),
    getAccounts()
  ]);
  
  const initialCategories = catResult.success && catResult.data ? catResult.data : [];
  const initialBudgets = budgetResult.success && budgetResult.data ? budgetResult.data : [];
  const initialAccounts = accountResult.success && accountResult.data ? accountResult.data : [];
  let initialTransactions: UITransaction[] = [];
  
  if (txResult.success && txResult.data) {
    initialTransactions = txResult.data.map((tx) => {
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
        amount: tx.type === "income" ? Number(tx.amount) : -Number(tx.amount),
        accountId: tx.accountId,
      };
    });
  }

  return <DashboardClient 
    initialTransactions={initialTransactions} 
    initialCategories={initialCategories as any} 
    initialBudgets={initialBudgets as any}
    initialAccounts={initialAccounts as any}
    userName={userName} 
  />;
}
