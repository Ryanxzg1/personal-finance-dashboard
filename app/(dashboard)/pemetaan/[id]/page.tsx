import { getMappingPlanDetails } from "@/lib/actions/mapping";
import { MappingDetailClient } from "@components/finance/mapping/mapping-detail-client";
import { notFound } from "next/navigation";
import { decodeId } from "@/lib/id-codec";

export const dynamic = "force-dynamic";

export default async function PemetaanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const planId = decodeId(id);
  
  if (planId === null) return notFound();

  const result = await getMappingPlanDetails(planId);
  
  if (!result.success || !result.data) {
    return notFound();
  }

  return (
    <MappingDetailClient plan={result.data as any} />
  );
}
