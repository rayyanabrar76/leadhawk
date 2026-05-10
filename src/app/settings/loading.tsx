import { Skeleton } from '@/components/ui/skeleton'
import { Logo } from '@/components/Logo'
import { ArrowLeft } from 'lucide-react'

function SectionSkeleton({ rows = 2, wide = false }: { rows?: number; wide?: boolean }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950">
      {/* section header */}
      <div className="px-5 py-3.5 border-b border-zinc-800/60 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Skeleton className="w-7 h-7 rounded-md" />
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-2.5 w-36" />
          </div>
        </div>
        <Skeleton className="h-7 w-14 rounded-md" />
      </div>
      {/* section body */}
      <div className="px-5 py-4 space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className={`h-9 ${wide ? 'w-full' : 'w-full'} rounded-md`} />
          </div>
        ))}
      </div>
    </div>
  )
}

function ChipRowSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950">
      <div className="px-5 py-3.5 border-b border-zinc-800/60 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Skeleton className="w-7 h-7 rounded-md" />
          <Skeleton className="h-3.5 w-24" />
        </div>
        <Skeleton className="h-7 w-14 rounded-md" />
      </div>
      <div className="px-5 py-4 flex flex-wrap gap-1.5">
        {[40, 56, 48, 64, 44, 52, 36].map((w, i) => (
          <Skeleton key={i} className="h-7 rounded-full" style={{ width: w }} />
        ))}
      </div>
    </div>
  )
}

export default function SettingsLoading() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="inline-flex items-center gap-2 text-sm text-zinc-400">
            <ArrowLeft className="w-4 h-4" />
            Back
          </span>
          <h1 className="text-sm font-semibold text-zinc-100">Profile settings</h1>
          <Logo variant="full" size="sm" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-20 space-y-4">
        {/* Profile divider */}
        <div className="flex items-center gap-3 pt-1">
          <div className="h-px flex-1 bg-zinc-800/60" />
          <Skeleton className="h-2.5 w-12" />
          <div className="h-px flex-1 bg-zinc-800/60" />
        </div>

        {/* Basics */}
        <SectionSkeleton rows={2} />
        {/* Rates */}
        <SectionSkeleton rows={2} />
        {/* Tech stack */}
        <ChipRowSkeleton />
        {/* Industries */}
        <ChipRowSkeleton />
        {/* Engagement */}
        <ChipRowSkeleton />
        {/* Links */}
        <SectionSkeleton rows={3} />
        {/* Resume */}
        <SectionSkeleton rows={1} />
        {/* Portfolio */}
        <SectionSkeleton rows={1} />

        {/* Account divider */}
        <div className="flex items-center gap-3 pt-1">
          <div className="h-px flex-1 bg-zinc-800/60" />
          <Skeleton className="h-2.5 w-16" />
          <div className="h-px flex-1 bg-zinc-800/60" />
        </div>

        {/* Account info */}
        <SectionSkeleton rows={1} />
      </main>
    </div>
  )
}
