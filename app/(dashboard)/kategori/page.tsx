import { getCategories } from "@/lib/actions/categories";
import { getBudgets } from "@/lib/actions/budgets";
import { CategoriesClient } from "@/components/finance/categories-client";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const now = new Date();
  
  const [catResult, budgetResult] = await Promise.all([
    getCategories(),
    getBudgets(now.getMonth(), now.getFullYear())
  ]);
  
  const initialCategories = catResult.success && catResult.data ? catResult.data : [];
  const initialBudgets = budgetResult.success && budgetResult.data ? budgetResult.data : [];

  return (
    <CategoriesClient 
      initialCategories={initialCategories as any} 
      initialBudgets={initialBudgets as any} 
    />
  );
}
