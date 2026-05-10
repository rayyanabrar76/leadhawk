'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, MessageCircle, Calendar, User } from 'lucide-react'

const TABS = [
  { href: '/app/leads', label: 'Leads', Icon: Search },
  { href: '/app/inbox', label: 'Inbox', Icon: MessageCircle },
  { href: '/app/calendar', label: 'Meetings', Icon: Calendar },
  { href: '/app/profile', label: 'Profile', Icon: User },
] as const

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-lg border-t border-zinc-800"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex justify-around items-stretch h-16 max-w-xl mx-auto">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname?.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center flex-1 gap-1 active:bg-zinc-900/60 transition-colors ${
                active ? 'text-violet-400' : 'text-zinc-500'
              }`}
            >
              <Icon className={`w-6 h-6 transition-transform ${active ? 'scale-110' : ''}`} />
              <span className="text-[10px] font-medium">{label}</span>
              {active && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-violet-400" />}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
