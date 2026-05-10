import { Skeleton } from '@/components/ui/skeleton'
import { MobileHeader } from '@/components/mobile/mobile-header'

export default function MobileLeadsLoading() {
  return (
    <>
      <MobileHeader />
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-7 w-24 rounded-full" />
      </div>
      <ul className="divide-y divide-zinc-800/60">
        {Array.from({ length: 8 }).map((_, i) => (
          <li key={i} className="flex items-start gap-3 px-4 py-4">
            <Skeleton className="w-10 h-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-3/4" />
              <div className="flex items-center gap-2 mt-1">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-3 w-8" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
