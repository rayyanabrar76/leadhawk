'use client'

import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'
import { InstallButton } from '@/components/mobile/install-button'

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean
}

const DISMISS_KEY = 'lh-install-banner-dismissed'

export function InstallBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as NavigatorWithStandalone).standalone === true
    if (standalone) return
    if (localStorage.getItem(DISMISS_KEY) === '1') return
    setShow(true)
  }, [])

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, '1')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="mx-4 mt-3 mb-1 rounded-xl bg-linear-to-br from-violet-600/15 via-violet-500/10 to-violet-700/15 border border-violet-500/30 p-3 flex items-center gap-3 relative animate-in fade-in slide-in-from-top-2">
      <div className="w-9 h-9 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
        <Download className="w-4 h-4 text-violet-300" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-zinc-100 leading-tight">Install LeadHawk</p>
        <p className="text-xs text-zinc-400 mt-0.5 leading-tight">Get the full app on your home screen</p>
      </div>
      <InstallButton variant="primary" label="Install" className="h-9 px-3 text-xs" />
      <button
        onClick={handleDismiss}
        aria-label="Dismiss"
        className="absolute top-1.5 right-1.5 p-1 rounded text-zinc-500 active:bg-zinc-800/50"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
