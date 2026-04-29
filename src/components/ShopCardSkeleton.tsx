import { Skeleton } from "@/components/ui/skeleton";

export function ShopCardSkeleton() {
  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-12 w-full rounded-2xl" />
        <Skeleton className="h-12 w-full rounded-2xl" />
      </div>
      <Skeleton className="mt-4 h-10 w-full rounded-2xl" />
      <Skeleton className="mt-3 h-14 w-full rounded-2xl" />
    </div>
  );
}
