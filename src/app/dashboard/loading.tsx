import { Skeleton } from '@/components/ui/skeleton'
import { Logo } from '@/components/Logo'

function StatCardSkeleton() {
  return (
    <div className="border border-border rounded-lg p-4">
      <Skeleton className="h-3 w-16 mb-2" />
      <Skeleton className="h-7 w-8" />
    </div>
  )
}

function LeadCardSkeleton() {
  return (
    <div className="border border-border rounded-lg p-3 sm:p-4 space-y-3">
      <div className="flex gap-2 items-center flex-wrap">
        <Skeleton className="h-4 w-10 rounded" />
        <Skeleton className="h-4 w-16 rounded" />
        <Skeleton className="h-4 w-8 rounded" />
        <Skeleton className="h-3 w-12 rounded ml-auto" />
      </div>
      <Skeleton className="h-4 w-full rounded" />
      <Skeleton className="h-4 w-3/4 rounded" />
      <Skeleton className="h-3 w-1/3 rounded" />
      <div className="pt-3 border-t border-border/50 flex gap-2">
        <Skeleton className="h-8 w-24 rounded" />
        <Skeleton className="h-8 w-16 rounded" />
      </div>
    </div>
  )
}

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="sm:hidden">
              <Logo variant="icon" size="sm" href={null} />
            </div>
            <div className="hidden sm:block">
              <Logo variant="full" size="sm" href={null} />
            </div>
            <div className="flex-1" />
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 sm:w-32 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
          <Skeleton className="sm:hidden h-3 w-40 mt-2" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>

        {/* Filter tabs */}
        <div className="flex items-center justify-between border-b border-border">
          <div className="flex gap-2 pb-2">
            <Skeleton className="h-5 w-10 rounded" />
            <Skeleton className="h-5 w-12 rounded" />
            <Skeleton className="h-5 w-14 rounded" />
            <Skeleton className="h-5 w-10 rounded" />
          </div>
          <Skeleton className="h-7 w-28 rounded-md mb-1" />
        </div>

        {/* Lead cards */}
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <LeadCardSkeleton key={i} />
          ))}
        </div>
      </main>
    </div>
  )
}
