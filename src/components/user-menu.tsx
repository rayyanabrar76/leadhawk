'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Settings, LogOut, Trash2, UserX, ChevronDown } from 'lucide-react'

interface UserMenuProps {
  email: string
  onLeadsCleared?: () => void
}

function initialsFromEmail(email: string): string {
  return email.slice(0, 2).toUpperCase() || 'U'
}

export function UserMenu({ email, onLeadsCleared }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState<'signout' | 'clear' | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  async function handleSignOut() {
    setBusy('signout')
    await supabase.auth.signOut()
    router.replace('/')
  }

  async function handleClearLeads() {
    if (!window.confirm('Delete all leads and pitches? This cannot be undone.')) return
    setBusy('clear')
    setOpen(false)
    try {
      const res = await fetch('/api/leads/clear', { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Clear failed')
      toast.success(`Cleared ${data.deleted ?? 0} leads`)
      onLeadsCleared?.()
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Clear failed')
    }
    setBusy(null)
  }

  function handleDeleteAccount() {
    setOpen(false)
    router.push('/settings#delete-account')
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-full transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label="Account menu"
        aria-expanded={open}
      >
        <span className="w-8 h-8 rounded-full bg-violet-600 text-white text-xs font-bold flex items-center justify-center">
          {initialsFromEmail(email)}
        </span>
        <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-lg border border-zinc-800 bg-zinc-950 shadow-2xl ring-1 ring-white/5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-3 py-2.5 border-b border-zinc-800">
            <p className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold">Signed in as</p>
            <p className="text-sm text-zinc-100 truncate mt-0.5">{email}</p>
          </div>

          <div className="py-1">
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-900"
            >
              <Settings className="w-4 h-4 text-zinc-400" />
              Profile settings
            </Link>
            <button
              onClick={handleSignOut}
              disabled={busy !== null}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-900 disabled:opacity-50"
            >
              <LogOut className="w-4 h-4 text-zinc-400" />
              {busy === 'signout' ? 'Signing out…' : 'Sign out'}
            </button>
          </div>

          <div className="border-t border-zinc-800 py-1">
            <button
              onClick={handleClearLeads}
              disabled={busy !== null}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-300 hover:bg-red-950/30 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              {busy === 'clear' ? 'Clearing…' : 'Clear all leads'}
            </button>
            <button
              onClick={handleDeleteAccount}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-300 hover:bg-red-950/30"
            >
              <UserX className="w-4 h-4" />
              Delete my account
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
