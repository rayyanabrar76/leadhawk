'use client'

import { useEffect, useState } from 'react'
import { Download, X, Share, Plus } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
  prompt(): Promise<void>
}

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean
}

interface InstallButtonProps {
  className?: string
  variant?: 'primary' | 'subtle'
  label?: string
}

export function InstallButton({
  className = '',
  variant = 'subtle',
  label = 'Install app',
}: InstallButtonProps) {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop' | 'other'>('other')

  useEffect(() => {
    if (typeof window === 'undefined') return

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as NavigatorWithStandalone).standalone === true
    setInstalled(standalone)

    const ua = navigator.userAgent
    if (/iPhone|iPad|iPod/i.test(ua)) setPlatform('ios')
    else if (/Android/i.test(ua)) setPlatform('android')
    else if (window.matchMedia('(min-width: 768px)').matches) setPlatform('desktop')
    else setPlatform('other')

    const handler = (e: Event) => {
      e.preventDefault()
      setInstallEvent(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)

    const installedHandler = () => {
      setInstalled(true)
      setInstallEvent(null)
    }
    window.addEventListener('appinstalled', installedHandler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', installedHandler)
    }
  }, [])

  if (installed) return null

  async function handleClick() {
    if (installEvent) {
      try {
        await installEvent.prompt()
        const { outcome } = await installEvent.userChoice
        if (outcome === 'accepted') setInstalled(true)
        setInstallEvent(null)
      } catch {
        setShowInstructions(true)
      }
    } else {
      setShowInstructions(true)
    }
  }

  const baseCls =
    variant === 'primary'
      ? 'inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-violet-600 active:bg-violet-700 text-white font-semibold text-sm transition-colors'
      : 'inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-zinc-800 active:bg-zinc-700 text-zinc-100 font-medium text-sm transition-colors'

  return (
    <>
      <button onClick={handleClick} className={`${baseCls} ${className}`}>
        <Download className="w-4 h-4" />
        {label}
      </button>

      {showInstructions && (
        <div
          className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowInstructions(false)}
        >
          <div
            className="w-full max-w-sm bg-zinc-900 rounded-2xl border border-zinc-800 p-6 ring-1 ring-white/5 animate-in slide-in-from-bottom-4 sm:zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-semibold text-zinc-50">Install LeadHawk</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Get the full app on your home screen</p>
              </div>
              <button
                onClick={() => setShowInstructions(false)}
                className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {platform === 'ios' && (
              <ol className="space-y-4 text-sm text-zinc-300">
                <li className="flex items-start gap-3">
                  <span className="flex w-6 h-6 rounded-full bg-violet-500/20 text-violet-300 text-xs font-bold items-center justify-center shrink-0">1</span>
                  <span>
                    Tap the{' '}
                    <span className="inline-flex items-center mx-0.5 px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-100 text-xs">
                      <Share className="w-3.5 h-3.5 mr-1" /> Share
                    </span>{' '}
                    button at the bottom of Safari
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex w-6 h-6 rounded-full bg-violet-500/20 text-violet-300 text-xs font-bold items-center justify-center shrink-0">2</span>
                  <span>
                    Scroll down and tap{' '}
                    <span className="inline-flex items-center mx-0.5 px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-100 text-xs">
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add to Home Screen
                    </span>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex w-6 h-6 rounded-full bg-violet-500/20 text-violet-300 text-xs font-bold items-center justify-center shrink-0">3</span>
                  <span>
                    Tap <strong className="text-zinc-50">Add</strong> in the top right corner
                  </span>
                </li>
              </ol>
            )}

            {platform === 'android' && (
              <ol className="space-y-4 text-sm text-zinc-300">
                <li className="flex items-start gap-3">
                  <span className="flex w-6 h-6 rounded-full bg-violet-500/20 text-violet-300 text-xs font-bold items-center justify-center shrink-0">1</span>
                  <span>Tap the <strong className="text-zinc-50">⋮</strong> menu in Chrome (top right)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex w-6 h-6 rounded-full bg-violet-500/20 text-violet-300 text-xs font-bold items-center justify-center shrink-0">2</span>
                  <span>Tap <strong className="text-zinc-50">Install app</strong> or <strong className="text-zinc-50">Add to Home screen</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex w-6 h-6 rounded-full bg-violet-500/20 text-violet-300 text-xs font-bold items-center justify-center shrink-0">3</span>
                  <span>Tap <strong className="text-zinc-50">Install</strong> to confirm</span>
                </li>
              </ol>
            )}

            {(platform === 'desktop' || platform === 'other') && (
              <div className="space-y-3 text-sm text-zinc-300">
                <p>To install LeadHawk on this device:</p>
                <ul className="space-y-2 text-zinc-400">
                  <li>• <strong className="text-zinc-100">Chrome / Edge:</strong> click the install icon in the address bar (right side)</li>
                  <li>• <strong className="text-zinc-100">Safari Mac:</strong> File menu → Add to Dock</li>
                  <li>• <strong className="text-zinc-100">Firefox:</strong> not currently supported</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
