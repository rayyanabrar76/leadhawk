'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import {
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
  Sparkles,
  Upload,
  Plus,
  X,
  Pencil,
  ChevronDown,
  ExternalLink,
  Globe,
  Code2,
  UserX,
  Link2,
  Check,
} from 'lucide-react'
import { InstallButton } from '@/components/mobile/install-button'

interface ProfileShape {
  email?: string | null
  skill?: string | null
  bio?: string | null
  years_experience?: number | null
  hourly_rate_min?: number | null
  hourly_rate_max?: number | null
  preferred_engagement?: string[] | null
  industries?: string[] | null
  tech_stack?: string[] | null
  portfolio_url?: string | null
  linkedin_url?: string | null
  github_url?: string | null
  resume_filename?: string | null
  resume_uploaded_at?: string | null
  profile_summary?: string | null
  profile_summary_generated_at?: string | null
}

interface PortfolioItem {
  id: string
  title: string
  url: string | null
  description: string | null
  tech_used: string[] | null
  outcome: string | null
  created_at: string
}

interface Props {
  email: string
  profile: ProfileShape | null
  portfolio: PortfolioItem[]
  gmailConnected: boolean
}

function initialsFromEmail(email: string): string {
  return email.slice(0, 2).toUpperCase() || 'U'
}

function rateRange(p: ProfileShape | null): string | null {
  if (!p) return null
  if (p.hourly_rate_min && p.hourly_rate_max) return `$${p.hourly_rate_min}–$${p.hourly_rate_max}/hr`
  if (p.hourly_rate_min) return `$${p.hourly_rate_min}+/hr`
  return null
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-zinc-800/80 text-zinc-200 border border-zinc-700">
      {children}
    </span>
  )
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 pt-1">
      <div className="h-px flex-1 bg-zinc-800/60" />
      <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-semibold">{label}</span>
      <div className="h-px flex-1 bg-zinc-800/60" />
    </div>
  )
}

function CardHeader({
  icon: Icon,
  title,
  description,
  action,
  destructive,
}: {
  icon: React.ElementType
  title: string
  description?: string
  action?: React.ReactNode
  destructive?: boolean
}) {
  return (
    <div className={`px-5 py-3.5 border-b ${destructive ? 'border-red-900/30' : 'border-zinc-800/60'} flex items-center justify-between gap-3`}>
      <div className="flex items-center gap-2.5 min-w-0">
        <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${destructive ? 'bg-red-950/60' : 'bg-zinc-800/80'}`}>
          <Icon className={`w-3.5 h-3.5 ${destructive ? 'text-red-400' : 'text-zinc-400'}`} />
        </div>
        <div className="min-w-0">
          <h2 className={`text-sm font-semibold ${destructive ? 'text-red-300' : 'text-zinc-100'}`}>{title}</h2>
          {description && <p className="text-xs text-zinc-500 mt-0.5 leading-tight">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}

function CardRow({
  icon: Icon,
  label,
  href,
  onClick,
  trailing,
  destructive,
  disabled,
}: {
  icon: React.ElementType
  label: string
  href?: string
  onClick?: () => void
  trailing?: React.ReactNode
  destructive?: boolean
  disabled?: boolean
}) {
  const cls = `flex items-center gap-3 px-5 py-3.5 transition-colors disabled:opacity-50 ${
    destructive
      ? 'text-red-300 hover:bg-red-950/20 active:bg-red-950/30'
      : 'text-zinc-100 hover:bg-zinc-900/60 active:bg-zinc-900/80'
  }`
  const content = (
    <>
      <Icon className={`w-4 h-4 shrink-0 ${destructive ? 'text-red-400' : 'text-zinc-400'}`} />
      <span className="flex-1 text-sm font-medium">{label}</span>
      {trailing ?? (!destructive && <ChevronRight className="w-4 h-4 text-zinc-600" />)}
    </>
  )
  if (href) return <Link href={href} className={cls}>{content}</Link>
  return (
    <button onClick={onClick} disabled={disabled} className={`w-full text-left ${cls}`}>
      {content}
    </button>
  )
}

export function ProfileClient({ email, profile, portfolio: initialPortfolio, gmailConnected }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [confirming, setConfirming] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [uploadingResume, setUploadingResume] = useState(false)
  const [resumeName, setResumeName] = useState(profile?.resume_filename ?? null)
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deletingAccount, setDeletingAccount] = useState(false)

  const [portfolio, setPortfolio] = useState<PortfolioItem[]>(initialPortfolio)
  const [showAdd, setShowAdd] = useState(false)
  const [newItem, setNewItem] = useState({ title: '', url: '', description: '', outcome: '' })
  const [savingItem, setSavingItem] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [goingToSettings, setGoingToSettings] = useState(false)

  const bio = profile?.bio ?? null
  const stack = profile?.tech_stack ?? []
  const industries = profile?.industries ?? []
  const engagement = profile?.preferred_engagement ?? []
  const rate = rateRange(profile)

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

  async function handleDeleteAccount() {
    setDeletingAccount(true)
    try {
      const res = await fetch('/api/account', { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Delete failed')
      window.location.href = '/'
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete account')
      setDeletingAccount(false)
    }
  }

  async function handleResumeUpload(file: File) {
    setUploadingResume(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/profile/resume', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Upload failed')
      setResumeName(file.name)
      toast.success('Resume parsed and saved')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    }
    setUploadingResume(false)
  }

  async function handleAddItem() {
    if (!newItem.title.trim() && !newItem.url.trim()) {
      toast.error('Add a title or URL')
      return
    }
    setSavingItem(true)
    try {
      const res = await fetch('/api/profile/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newItem.title.trim() || newItem.url.trim(),
          url: newItem.url.trim() || null,
          description: newItem.description.trim() || null,
          outcome: newItem.outcome.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Save failed')
      setPortfolio((p) => [data.item, ...p])
      setNewItem({ title: '', url: '', description: '', outcome: '' })
      setShowAdd(false)
      toast.success('Project added')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
    }
    setSavingItem(false)
  }

  async function handleDeleteItem(id: string) {
    const prev = portfolio
    setPortfolio((p) => p.filter((it) => it.id !== id))
    try {
      const res = await fetch(`/api/profile/portfolio/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      toast.success('Removed')
    } catch {
      setPortfolio(prev)
      toast.error('Could not remove')
    }
  }

  const inputCls = 'w-full h-10 rounded-lg bg-zinc-900 border border-zinc-800 px-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none'

  return (
    <>
      <Toaster position="top-center" theme="dark" />
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleResumeUpload(f)
        }}
      />

      <div className="px-4 sm:px-6 py-5 pb-28 space-y-3">

        {/* Account header */}
        <div className="rounded-xl border border-zinc-800 bg-linear-to-br from-zinc-950 to-zinc-900 px-5 py-5">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-14 h-14 rounded-full bg-linear-to-br from-violet-500 to-violet-700 text-white text-lg font-bold flex items-center justify-center shrink-0 shadow-lg shadow-violet-900/30">
              {initialsFromEmail(email)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-100 truncate">{email}</p>
              {profile?.skill && <p className="text-xs text-zinc-500 mt-0.5">{profile.skill}</p>}
            </div>
            <button
              onClick={() => { setGoingToSettings(true); router.push('/settings') }}
              className="p-2 rounded-lg bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 transition-colors"
              aria-label="Edit profile"
            >
              {goingToSettings
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Pencil className="w-4 h-4" />}
            </button>
          </div>
          {bio ? (
            <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3">{bio}</p>
          ) : (
            <Link
              href="/onboarding"
              className="text-xs text-violet-400 inline-flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              Complete your profile
            </Link>
          )}
          {(profile?.years_experience || rate || engagement.length > 0) && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {profile?.years_experience && <Chip>{profile.years_experience}y exp</Chip>}
              {rate && <Chip>{rate}</Chip>}
              {engagement.slice(0, 2).map((e) => <Chip key={e}>{e}</Chip>)}
            </div>
          )}
        </div>

        <SectionDivider label="Profile" />

        {/* Skills */}
        {(stack.length > 0 || industries.length > 0) && (
          <section className="rounded-xl border border-zinc-800 bg-zinc-950">
            <CardHeader icon={Code2} title="Skills" />
            <div className="px-5 py-4 space-y-3">
              {stack.length > 0 && (
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold mb-2">Tech stack</p>
                  <div className="flex flex-wrap gap-1.5">
                    {stack.map((t) => <Chip key={t}>{t}</Chip>)}
                  </div>
                </div>
              )}
              {industries.length > 0 && (
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold mb-2">Industries</p>
                  <div className="flex flex-wrap gap-1.5">
                    {industries.map((i) => <Chip key={i}>{i}</Chip>)}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Resume */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-950">
          <CardHeader icon={Upload} title="Resume" description="PDF or DOCX, max 5MB" />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingResume}
            className="w-full flex items-center gap-3 px-5 py-4 hover:bg-zinc-900/60 active:bg-zinc-900/80 transition-colors disabled:opacity-50"
          >
            {uploadingResume ? (
              <Loader2 className="w-4 h-4 text-violet-400 animate-spin shrink-0" />
            ) : resumeName ? (
              <FileText className="w-4 h-4 text-violet-400 shrink-0" />
            ) : (
              <Upload className="w-4 h-4 text-zinc-500 shrink-0" />
            )}
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium text-zinc-100 truncate">
                {resumeName ?? 'Upload resume'}
              </p>
              <p className="text-xs text-zinc-500">
                {uploadingResume ? 'Parsing…' : resumeName ? 'Tap to replace' : 'Not uploaded yet'}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-600 shrink-0" />
          </button>
        </section>

        {/* Portfolio */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-950">
          <CardHeader
            icon={FileText}
            title="Portfolio"
            description="Projects improve pitch quality."
            action={
              <button
                onClick={() => setShowAdd((v) => !v)}
                className="inline-flex items-center gap-1 text-xs font-medium text-violet-400"
              >
                {showAdd ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                {showAdd ? 'Cancel' : 'Add'}
              </button>
            }
          />
          <div className="divide-y divide-zinc-800/60">
            {showAdd && (
              <div className="px-5 py-4 space-y-2.5">
                <input
                  value={newItem.title}
                  onChange={(e) => setNewItem((n) => ({ ...n, title: e.target.value }))}
                  placeholder="Project title"
                  className={inputCls}
                />
                <input
                  value={newItem.url}
                  onChange={(e) => setNewItem((n) => ({ ...n, url: e.target.value }))}
                  placeholder="URL (optional)"
                  className={inputCls}
                />
                <textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem((n) => ({ ...n, description: e.target.value }))}
                  rows={2}
                  placeholder="2-3 sentences on what you built"
                  className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none resize-none"
                />
                <input
                  value={newItem.outcome}
                  onChange={(e) => setNewItem((n) => ({ ...n, outcome: e.target.value }))}
                  placeholder="Outcome (e.g. cut load time 40%)"
                  className={inputCls}
                />
                <button
                  onClick={handleAddItem}
                  disabled={(!newItem.title.trim() && !newItem.url.trim()) || savingItem}
                  className="w-full h-10 rounded-lg bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white font-medium text-sm disabled:opacity-50 inline-flex items-center justify-center gap-1.5 transition-colors"
                >
                  {savingItem ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Save project
                </button>
              </div>
            )}
            {portfolio.length === 0 && !showAdd && (
              <div className="px-5 py-6 text-center">
                <p className="text-sm text-zinc-500">No projects yet</p>
                <p className="text-xs text-zinc-600 mt-1">Add 3–5 of your best work to improve pitches</p>
              </div>
            )}
            {portfolio.map((item) => (
              <div key={item.id} className="flex items-start gap-3 px-5 py-3.5">
                <Code2 className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-zinc-100 truncate flex-1">{item.title}</p>
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-500 hover:text-violet-400 transition-colors"
                        aria-label="Open project"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">{item.description}</p>
                  )}
                  {item.outcome && (
                    <p className="text-xs text-violet-300/80 mt-1">→ {item.outcome}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="p-1 text-zinc-600 hover:text-red-400 transition-colors"
                  aria-label="Remove"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Links */}
        {(profile?.portfolio_url || profile?.linkedin_url || profile?.github_url) && (
          <section className="rounded-xl border border-zinc-800 bg-zinc-950">
            <CardHeader icon={Link2} title="Links" />
            <div className="divide-y divide-zinc-800/60">
              {profile?.portfolio_url && (
                <a
                  href={profile.portfolio_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-zinc-900/60 transition-colors"
                >
                  <Globe className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span className="flex-1 text-sm font-medium text-zinc-100">Portfolio</span>
                  <ExternalLink className="w-4 h-4 text-zinc-600" />
                </a>
              )}
              {profile?.linkedin_url && (
                <a
                  href={profile.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-zinc-900/60 transition-colors"
                >
                  <Globe className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span className="flex-1 text-sm font-medium text-zinc-100">LinkedIn</span>
                  <ExternalLink className="w-4 h-4 text-zinc-600" />
                </a>
              )}
              {profile?.github_url && (
                <a
                  href={profile.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-zinc-900/60 transition-colors"
                >
                  <Code2 className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span className="flex-1 text-sm font-medium text-zinc-100">GitHub</span>
                  <ExternalLink className="w-4 h-4 text-zinc-600" />
                </a>
              )}
            </div>
          </section>
        )}

        {/* AI summary */}
        {profile?.profile_summary && (
          <section className="rounded-xl border border-zinc-800 bg-zinc-950">
            <button
              onClick={() => setShowSummary((v) => !v)}
              className="w-full flex items-center gap-2.5 px-5 py-3.5 hover:bg-zinc-900/60 transition-colors"
            >
              <div className="w-7 h-7 rounded-md bg-zinc-800/80 flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              </div>
              <span className="flex-1 text-left text-sm font-semibold text-zinc-100">
                AI profile summary
              </span>
              <ChevronDown
                className={`w-4 h-4 text-zinc-500 transition-transform ${showSummary ? 'rotate-180' : ''}`}
              />
            </button>
            {showSummary && (
              <div className="px-5 pb-4 border-t border-zinc-800/60">
                <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap pt-3">
                  {profile.profile_summary}
                </p>
              </div>
            )}
          </section>
        )}

        <SectionDivider label="Account" />

        {/* Account rows */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-950">
          <div className="divide-y divide-zinc-800/60">
            <div className="flex items-center gap-3 px-5 py-3.5">
              {gmailConnected
                ? <Wifi className="w-4 h-4 text-zinc-400 shrink-0" />
                : <WifiOff className="w-4 h-4 text-zinc-400 shrink-0" />
              }
              <span className="flex-1 text-sm font-medium text-zinc-100">Gmail</span>
              {gmailConnected ? (
                <span className="text-xs font-medium text-green-500">Connected</span>
              ) : (
                <a href="/api/google/connect" className="text-xs font-medium text-yellow-400 hover:text-yellow-300">
                  Connect
                </a>
              )}
            </div>
            <CardRow icon={Bell} label="Notifications" onClick={() => toast('Coming soon')} />
            <CardRow icon={CreditCard} label="Pricing &amp; plan" href="/pricing" />
            <CardRow icon={Shield} label="Privacy policy" href="/privacy" />
            <CardRow icon={HelpCircle} label="Help" onClick={() => toast('Coming soon')} />
          </div>
        </section>

        <SectionDivider label="Danger" />

        {/* Danger zone */}
        <section className="rounded-xl border border-red-900/40 bg-red-950/10">
          <CardHeader icon={AlertTriangle} title="Danger zone" description="These actions are permanent." destructive />
          <div className="divide-y divide-red-900/20">
            {/* Clear leads */}
            {!confirming ? (
              <CardRow
                icon={Trash2}
                label="Clear all leads"
                onClick={() => setConfirming(true)}
                trailing={<span className="text-xs text-red-400/60 font-medium">Irreversible</span>}
                destructive
              />
            ) : (
              <div className="px-5 py-4 space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-zinc-100">Delete all leads?</p>
                    <p className="text-xs text-zinc-400 mt-0.5">Cannot be undone. Your profile stays.</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirming(false)}
                    disabled={clearing}
                    className="flex-1 h-10 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-medium text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleClear}
                    disabled={clearing}
                    className="flex-1 h-10 inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium text-sm disabled:opacity-50 transition-colors"
                  >
                    {clearing && <Loader2 className="w-4 h-4 animate-spin" />}
                    {clearing ? 'Deleting…' : 'Yes, delete'}
                  </button>
                </div>
              </div>
            )}

            {/* Delete account */}
            {!deleteAccountOpen ? (
              <CardRow
                icon={UserX}
                label="Delete my account"
                onClick={() => setDeleteAccountOpen(true)}
                trailing={<span className="text-xs text-red-400/60 font-medium">Permanent</span>}
                destructive
              />
            ) : (
              <div className="px-5 py-4 space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-zinc-100">Permanently delete account?</p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Removes everything: profile, resume, portfolio, leads, pitches, Gmail connection.
                    </p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold">
                    Type <span className="font-mono font-bold text-red-300 normal-case tracking-normal">DELETE</span> to confirm
                  </p>
                  <input
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="DELETE"
                    disabled={deletingAccount}
                    className="w-full h-10 rounded-lg bg-zinc-900 border border-zinc-800 px-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setDeleteAccountOpen(false); setDeleteConfirmText('') }}
                    disabled={deletingAccount}
                    className="flex-1 h-10 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-medium text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deletingAccount || deleteConfirmText !== 'DELETE'}
                    className="flex-1 h-10 inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium text-sm disabled:opacity-50 transition-colors"
                  >
                    {deletingAccount && <Loader2 className="w-4 h-4 animate-spin" />}
                    {deletingAccount ? 'Deleting…' : 'Delete forever'}
                  </button>
                </div>
              </div>
            )}

            {/* Sign out */}
            <CardRow icon={LogOut} label="Sign out" onClick={handleSignOut} destructive />
          </div>
        </section>

        {/* Install */}
        <div className="flex justify-center pt-1">
          <InstallButton variant="subtle" label="Install on this device" className="w-full" />
        </div>

        <p className="text-center text-xs text-zinc-700 mt-2">LeadHawk · v1</p>
      </div>
    </>
  )
}
