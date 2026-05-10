'use client'

import { useRouter, usePathname } from 'next/navigation'
import { ChevronLeft, RefreshCw } from 'lucide-react'
import { Logo } from '@/components/Logo'

interface MobileHeaderProps {
  /** Refresh handler when on /app/leads */
  onRefresh?: () => void
  refreshing?: boolean
  /** Override title (used for sub-pages) */
  title?: string
  /** Show back button if true (sub-pages) */
  showBack?: boolean
}

const TITLES: Record<string, string> = {
  '/app/inbox': 'Inbox',
  '/app/calendar': 'Meetings',
  '/app/profile': 'Profile',
}

export function MobileHeader({ onRefresh, refreshing, title, showBack }: MobileHeaderProps) {
  const router = useRouter()
  const pathname = usePathname() ?? ''

  const isLeads = pathname === '/app/leads'
  const headerTitle = title ?? TITLES[pathname] ?? ''

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-lg border-b border-zinc-800"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="h-14 max-w-xl mx-auto px-3 flex items-center justify-between gap-2">
        <div className="flex items-center min-w-0">
          {showBack ? (
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 rounded-full text-zinc-200 active:bg-zinc-800 transition-colors"
              aria-label="Back"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          ) : isLeads ? (
            <Logo variant="full" size="sm" href={null} />
          ) : null}
        </div>

        {!isLeads && headerTitle && (
          <h1 className="text-base font-semibold text-zinc-100 absolute left-1/2 -translate-x-1/2">
            {headerTitle}
          </h1>
        )}

        <div className="flex items-center">
          {isLeads && onRefresh && (
            <button
              onClick={onRefresh}
              disabled={refreshing}
              className="p-2 rounded-full text-zinc-300 active:bg-zinc-800 transition-colors disabled:opacity-50"
              aria-label="Refresh leads"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
