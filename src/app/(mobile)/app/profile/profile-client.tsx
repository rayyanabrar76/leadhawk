'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import {
  Mail,
  Briefcase,
  Bell,
  CreditCard,
  Shield,
  FileText,
  HelpCircle,
  ChevronRight,
  LogOut,
  Trash2,
  Wifi,
  WifiOff,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import { InstallButton } from '@/components/mobile/install-button'

interface Props {
  email: string
  skill: string
  gmailConnected: boolean
}

function initialsFromEmail(email: string): string {
  return email.slice(0, 2).toUpperCase() || 'U'
}

interface SettingsRowProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  href?: string
  onClick?: () => void
  trailing?: React.ReactNode
  destructive?: boolean
}

function SettingsRow({ icon: Icon, label, href, onClick, trailing, destructive }: SettingsRowProps) {
  const cls = `flex items-center gap-3 px-4 py-3.5 active:bg-zinc-900/60 transition-colors ${
    destructive ? 'text-red-400' : 'text-zinc-100'
  }`
  const content = (
    <>
      <Icon className={`w-5 h-5 ${destructive ? 'text-red-400' : 'text-zinc-400'}`} />
      <span className="flex-1 text-sm font-medium">{label}</span>
      {trailing ?? (!destructive && <ChevronRight className="w-4 h-4 text-zinc-600" />)}
    </>
  )
  if (href) return <Link href={href} className={cls}>{content}</Link>
  return <button onClick={onClick} className={`w-full text-left ${cls}`}>{content}</button>
}

export function ProfileClient({ email, skill, gmailConnected }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [clearing, setClearing] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.replace('/')
  }

  async function handleClear() {
    setClearing(true)
    try {
      const res = await fetch('/api/leads/clear', { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Clear failed')
      toast.success(`Cleared ${data.deleted ?? 0} leads`)
      setConfirming(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Clear failed')
    }
    setClearing(false)
  }

  return (
    <>
      <Toaster position="top-center" theme="dark" />

      {/* Profile header */}
      <div className="flex flex-col items-center text-center px-4 pt-6 pb-8 border-b border-zinc-800">
        <div className="w-20 h-20 rounded-full bg-violet-600 text-white text-2xl font-bold flex items-center justify-center mb-3">
          {initialsFromEmail(email)}
        </div>
        <p className="text-sm font-medium text-zinc-100 mb-0.5">{email}</p>
        <p className="text-xs text-zinc-500">{skill}</p>
      </div>

      {/* Account section */}
      <section className="mt-2">
        <h3 className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold px-4 pt-4 pb-2">
          Account
        </h3>
        <div className="bg-zinc-900/40 divide-y divide-zinc-800/60 border-y border-zinc-800/60">
          <SettingsRow
            icon={Mail}
            label="Email"
            trailing={<span className="text-xs text-zinc-500 truncate max-w-[160px]">{email}</span>}
          />
          <SettingsRow
            icon={Briefcase}
            label="Skill"
            trailing={<span className="text-xs text-zinc-500 truncate max-w-[160px]">{skill}</span>}
          />
          <SettingsRow
            icon={gmailConnected ? Wifi : WifiOff}
            label="Gmail"
            href={gmailConnected ? undefined : '/api/google/connect'}
            trailing={
              <span className={`text-xs ${gmailConnected ? 'text-green-500' : 'text-yellow-400'}`}>
                {gmailConnected ? 'Connected' : 'Connect'}
              </span>
            }
          />
        </div>
      </section>

      {/* Settings section */}
      <section className="mt-2">
        <h3 className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold px-4 pt-4 pb-2">
          Settings
        </h3>
        <div className="bg-zinc-900/40 divide-y divide-zinc-800/60 border-y border-zinc-800/60">
          <SettingsRow icon={Bell} label="Notifications" onClick={() => toast('Coming soon')} />
          <SettingsRow icon={CreditCard} label="Pricing & plan" href="/pricing" />
          <SettingsRow icon={Shield} label="Privacy policy" href="/privacy" />
          <SettingsRow icon={FileText} label="Terms" href="/terms" />
          <SettingsRow icon={HelpCircle} label="Help" onClick={() => toast('Coming soon')} />
        </div>
      </section>

      {/* Danger zone */}
      <section className="mt-2">
        <h3 className="text-[11px] uppercase tracking-wider text-red-400 font-semibold px-4 pt-4 pb-2">
          Danger zone
        </h3>
        <div className="bg-zinc-900/40 divide-y divide-zinc-800/60 border-y border-zinc-800/60">
          {!confirming ? (
            <SettingsRow
              icon={Trash2}
              label="Clear all leads"
              onClick={() => setConfirming(true)}
              destructive
              trailing={<span className="text-xs text-red-400/60">Irreversible</span>}
            />
          ) : (
            <div className="p-4 bg-red-950/20">
              <div className="flex items-start gap-3 mb-3">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-zinc-100 mb-1">Delete all leads?</p>
                  <p className="text-xs text-zinc-400">
                    This permanently deletes every lead and pitch. Cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirming(false)}
                  disabled={clearing}
                  className="flex-1 h-10 rounded-lg bg-zinc-800 active:bg-zinc-700 text-zinc-100 font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClear}
                  disabled={clearing}
                  className="flex-1 h-10 inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-600 active:bg-red-700 text-white font-medium text-sm disabled:opacity-50"
                >
                  {clearing && <Loader2 className="w-4 h-4 animate-spin" />}
                  {clearing ? 'Deleting…' : 'Yes, delete'}
                </button>
              </div>
            </div>
          )}
          <SettingsRow icon={LogOut} label="Sign out" onClick={handleSignOut} destructive />
        </div>
      </section>

      <div className="flex justify-center mt-6 px-4">
        <InstallButton variant="subtle" label="Install on this device" className="w-full" />
      </div>

      <p className="text-center text-xs text-zinc-600 mt-8 mb-4">LeadHawk · v1</p>
    </>
  )
}
