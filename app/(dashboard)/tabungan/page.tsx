import { Metadata } from "next"
import { Target, TrendingUp, Wallet, ArrowRight, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Tabungan Berencana",
  description: "Kelola target tabungan dan impian Anda.",
}

import { getSavingsGoals } from "@/lib/actions/savings";
import { SavingsClient } from "@/components/finance/savings-client";

export const dynamic = "force-dynamic";

export default async function SavingsPage() {
  const result = await getSavingsGoals();
  const initialGoals = result.success && result.data ? result.data : [];

  return (
    <SavingsClient initialGoals={initialGoals as any} />
  );
}
