'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/Logo'

const NAV_ITEMS = [
  { label: 'Features', href: '/#features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'How it works', href: '/#how-it-works' },
]

interface MarketingHeaderProps {
  onOpenAuth?: (mode: 'login' | 'signup') => void
}

export function MarketingHeader({ onOpenAuth }: MarketingHeaderProps = {}) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function open(mode: 'login' | 'signup') {
    setMobileOpen(false)
    if (onOpenAuth) {
      onOpenAuth(mode)
    } else {
      // Fallback for marketing pages without the modal mounted (pricing/privacy/terms):
      // navigate to landing with the auth query param
      window.location.href = `/?auth=${mode}`
    }
  }

  return (
    <header
      className={`sticky top-0 z-50 transition-colors ${
        scrolled
          ? 'bg-zinc-950/80 backdrop-blur border-b border-zinc-800/60'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Logo variant="full" size="md" href="/" />

        <nav className="hidden md:flex items-center gap-8">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800"
            onClick={() => open('login')}
          >
            Log in
          </Button>
          <Button
            size="sm"
            className="bg-violet-600 hover:bg-violet-700 text-white focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
            onClick={() => open('signup')}
          >
            Get started free
          </Button>
        </div>

        <button
          className="md:hidden text-zinc-300 p-2"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-zinc-800/60 bg-zinc-950">
          <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col gap-3">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="text-sm text-zinc-300 hover:text-zinc-100 py-1"
              >
                {item.label}
              </Link>
            ))}
            <div className="flex gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 w-full text-zinc-300"
                onClick={() => open('login')}
              >
                Log in
              </Button>
              <Button
                size="sm"
                className="flex-1 w-full bg-violet-600 hover:bg-violet-700"
                onClick={() => open('signup')}
              >
                Get started free
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
