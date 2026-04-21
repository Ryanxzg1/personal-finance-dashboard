import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-8 w-64" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
        {/* Summary Card Skeleton */}
        <Skeleton className="h-48 w-full rounded-sm" />
        {/* Quick Input Skeleton */}
        <Skeleton className="h-48 w-full rounded-sm" />
      </div>

      {/* Table Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full rounded-sm" />
      </div>
    </div>
  );
}
