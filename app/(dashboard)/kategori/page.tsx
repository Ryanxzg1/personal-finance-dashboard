import { getCategories } from "@/lib/actions/categories";
import { getBudgets } from "@/lib/actions/budgets";
import { getAccounts } from "@/lib/actions/accounts";
import { CategoriesClient } from "@/components/finance/categories/categories-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kategori",
};

import { getTransactions } from "@/lib/actions/transactions";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const now = new Date();
  
  const [catResult, budgetResult, accountResult, txResult] = await Promise.all([
    getCategories(),
    getBudgets(now.getMonth(), now.getFullYear()),
    getAccounts(),
    getTransactions()
  ]);
  
  const initialCategories = catResult.success && catResult.data ? catResult.data : [];
  const initialBudgets = budgetResult.success && budgetResult.data ? budgetResult.data : [];
  const initialAccounts = accountResult.success && accountResult.data ? accountResult.data : [];
  const initialTransactions = txResult.success && txResult.data ? txResult.data : [];

  return (
    <CategoriesClient 
      initialCategories={initialCategories as any} 
      initialBudgets={initialBudgets as any} 
      initialAccounts={initialAccounts as any}
      initialTransactions={initialTransactions as any}
    />
  );
}
