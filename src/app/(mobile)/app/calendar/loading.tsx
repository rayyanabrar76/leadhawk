import { Skeleton } from '@/components/ui/skeleton'
import { MobileHeader } from '@/components/mobile/mobile-header'

export default function MobileCalendarLoading() {
  return (
    <>
      <MobileHeader />
      <div className="flex flex-col items-center justify-center text-center px-6 py-20">
        <Skeleton className="w-20 h-20 rounded-full mb-5" />
        <Skeleton className="h-4 w-48 mb-3" />
        <Skeleton className="h-3 w-64 mb-1" />
        <Skeleton className="h-3 w-56" />
      </div>
    </>
  )
}
