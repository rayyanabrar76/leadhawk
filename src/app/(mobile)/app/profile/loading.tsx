import { Skeleton } from '@/components/ui/skeleton'
import { MobileHeader } from '@/components/mobile/mobile-header'

function SettingsRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <Skeleton className="w-5 h-5 rounded" />
      <Skeleton className="h-3.5 flex-1 max-w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  )
}

export default function MobileProfileLoading() {
  return (
    <>
      <MobileHeader />

      {/* Profile header */}
      <div className="flex flex-col items-center text-center px-4 pt-6 pb-8 border-b border-zinc-800">
        <Skeleton className="w-20 h-20 rounded-full mb-3" />
        <Skeleton className="h-3.5 w-44 mb-1.5" />
        <Skeleton className="h-3 w-32" />
      </div>

      {/* Account section */}
      <section className="mt-2">
        <div className="px-4 pt-4 pb-2">
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="bg-zinc-900/40 divide-y divide-zinc-800/60 border-y border-zinc-800/60">
          <SettingsRowSkeleton />
          <SettingsRowSkeleton />
          <SettingsRowSkeleton />
        </div>
      </section>

      {/* Settings section */}
      <section className="mt-2">
        <div className="px-4 pt-4 pb-2">
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="bg-zinc-900/40 divide-y divide-zinc-800/60 border-y border-zinc-800/60">
          <SettingsRowSkeleton />
          <SettingsRowSkeleton />
          <SettingsRowSkeleton />
          <SettingsRowSkeleton />
          <SettingsRowSkeleton />
        </div>
      </section>
    </>
  )
}
