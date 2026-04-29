import { getMappingPlans } from "@/lib/actions/mapping";
import { MappingClient } from "@components/finance/mapping/mapping-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pemetaan Biaya",
  description: "Arsitektur rencana pengeluaran masa depan Anda.",
};

export const dynamic = "force-dynamic";

export default async function PemetaanPage() {
  const result = await getMappingPlans();
  const initialPlans = result.success && result.data ? result.data : [];

  return (
    <MappingClient initialPlans={initialPlans as any} />
  );
}
