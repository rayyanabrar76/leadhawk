import { Skeleton } from '@/components/ui/skeleton'
import { MobileHeader } from '@/components/mobile/mobile-header'

export default function MobileLeadDetailLoading() {
  return (
    <>
      <MobileHeader title="Lead" showBack />
      <div className="px-4 py-4 border-b border-zinc-800 space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-32" />
      </div>
      <div className="px-4 py-4 border-b border-zinc-800 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-4/6" />
      </div>
      <div className="px-4 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-8 w-28 rounded-lg" />
        </div>
      </div>
    </>
  )
}
