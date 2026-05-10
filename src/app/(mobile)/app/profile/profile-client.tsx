'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import {
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

function SectionHeading({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 pt-4 pb-2">
      <h3 className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold">{title}</h3>
      {action}
    </div>
  )
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-zinc-800 text-zinc-200 border border-zinc-700">
      {children}
    </span>
  )
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
    if (!newItem.title.trim()) return
    setSavingItem(true)
    try {
      const res = await fetch('/api/profile/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newItem.title.trim(),
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

      {/* Profile header */}
      <div className="flex flex-col items-center text-center px-4 pt-6 pb-6 border-b border-zinc-800">
        <div className="w-20 h-20 rounded-full bg-violet-600 text-white text-2xl font-bold flex items-center justify-center mb-3">
          {initialsFromEmail(email)}
        </div>
        <p className="text-sm font-medium text-zinc-100 mb-0.5">{email}</p>
        {bio ? (
          <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed max-w-xs line-clamp-3">{bio}</p>
        ) : (
          <Link
            href="/onboarding"
            className="text-xs text-violet-400 mt-1.5 inline-flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3" />
            Complete your profile
          </Link>
        )}
        {(profile?.years_experience || rate || engagement.length > 0) && (
          <div className="flex items-center gap-1.5 flex-wrap justify-center mt-3">
            {profile?.years_experience && (
              <Chip>{profile.years_experience}y exp</Chip>
            )}
            {rate && <Chip>{rate}</Chip>}
            {engagement.slice(0, 2).map((e) => (
              <Chip key={e}>{e}</Chip>
            ))}
          </div>
        )}
        <Link
          href="/onboarding"
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-violet-400"
        >
          <Pencil className="w-3 h-3" />
          Edit profile
        </Link>
      </div>

      {(stack.length > 0 || industries.length > 0) && (
        <section>
          <SectionHeading title="Skills" />
          <div className="bg-zinc-900/40 px-4 py-3 border-y border-zinc-800/60 space-y-3">
            {stack.length > 0 && (
              <div>
                <p className="text-xs text-zinc-500 mb-1.5">Tech stack</p>
                <div className="flex flex-wrap gap-1.5">
                  {stack.map((t) => (
                    <Chip key={t}>{t}</Chip>
                  ))}
                </div>
              </div>
            )}
            {industries.length > 0 && (
              <div>
                <p className="text-xs text-zinc-500 mb-1.5">Industries</p>
                <div className="flex flex-wrap gap-1.5">
                  {industries.map((i) => (
                    <Chip key={i}>{i}</Chip>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      <section>
        <SectionHeading title="Resume" />
        <div className="bg-zinc-900/40 divide-y divide-zinc-800/60 border-y border-zinc-800/60">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingResume}
            className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-zinc-900/60 transition-colors disabled:opacity-50"
          >
            {uploadingResume ? (
              <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
            ) : resumeName ? (
              <FileText className="w-5 h-5 text-violet-400" />
            ) : (
              <Upload className="w-5 h-5 text-zinc-400" />
            )}
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium text-zinc-100 truncate">
                {resumeName ?? 'Upload resume'}
              </p>
              <p className="text-xs text-zinc-500">
                {uploadingResume
                  ? 'Parsing…'
                  : resumeName
                  ? 'Tap to replace'
                  : 'PDF or DOCX, max 5MB'}
              </p>
            </div>
          </button>
        </div>
      </section>

      <section>
        <SectionHeading
          title="Portfolio"
          action={
            <button
              onClick={() => setShowAdd((v) => !v)}
              className="text-xs font-medium text-violet-400 inline-flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              {showAdd ? 'Cancel' : 'Add'}
            </button>
          }
        />
        <div className="bg-zinc-900/40 divide-y divide-zinc-800/60 border-y border-zinc-800/60">
          {showAdd && (
            <div className="px-4 py-3 space-y-2 bg-zinc-900/60">
              <input
                value={newItem.title}
                onChange={(e) => setNewItem((n) => ({ ...n, title: e.target.value }))}
                placeholder="Project title"
                className="w-full h-10 rounded-lg bg-zinc-950 border border-zinc-800 px-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none"
              />
              <input
                value={newItem.url}
                onChange={(e) => setNewItem((n) => ({ ...n, url: e.target.value }))}
                placeholder="URL (optional)"
                className="w-full h-10 rounded-lg bg-zinc-950 border border-zinc-800 px-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none"
              />
              <textarea
                value={newItem.description}
                onChange={(e) => setNewItem((n) => ({ ...n, description: e.target.value }))}
                rows={2}
                placeholder="2-3 sentences on what you built"
                className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none resize-none"
              />
              <input
                value={newItem.outcome}
                onChange={(e) => setNewItem((n) => ({ ...n, outcome: e.target.value }))}
                placeholder="Outcome (e.g. cut load time 40%)"
                className="w-full h-10 rounded-lg bg-zinc-950 border border-zinc-800 px-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none"
              />
              <button
                onClick={handleAddItem}
                disabled={!newItem.title.trim() || savingItem}
                className="w-full h-10 rounded-lg bg-violet-600 active:bg-violet-700 text-white font-medium text-sm disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
              >
                {savingItem ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Save project
              </button>
            </div>
          )}
          {portfolio.length === 0 && !showAdd && (
            <div className="px-4 py-5 text-center">
              <p className="text-sm text-zinc-500">No projects yet</p>
              <p className="text-xs text-zinc-600 mt-1">Add 3-5 of your best work to improve pitches</p>
            </div>
          )}
          {portfolio.map((item) => (
            <div key={item.id} className="px-4 py-3 flex items-start gap-3">
              <Code2 className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-zinc-100 truncate flex-1">{item.title}</p>
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-500 active:text-violet-400"
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
                className="p-1 text-zinc-500 active:text-red-400"
                aria-label="Remove"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {(profile?.portfolio_url || profile?.linkedin_url || profile?.github_url) && (
        <section>
          <SectionHeading title="Links" />
          <div className="bg-zinc-900/40 divide-y divide-zinc-800/60 border-y border-zinc-800/60">
            {profile?.portfolio_url && (
              <a
                href={profile.portfolio_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3.5 active:bg-zinc-900/60"
              >
                <Globe className="w-5 h-5 text-zinc-400" />
                <span className="flex-1 text-sm font-medium text-zinc-100 truncate">Portfolio</span>
                <ExternalLink className="w-4 h-4 text-zinc-600" />
              </a>
            )}
            {profile?.linkedin_url && (
              <a
                href={profile.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3.5 active:bg-zinc-900/60"
              >
                <Globe className="w-5 h-5 text-zinc-400" />
                <span className="flex-1 text-sm font-medium text-zinc-100 truncate">LinkedIn</span>
                <ExternalLink className="w-4 h-4 text-zinc-600" />
              </a>
            )}
            {profile?.github_url && (
              <a
                href={profile.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3.5 active:bg-zinc-900/60"
              >
                <Code2 className="w-5 h-5 text-zinc-400" />
                <span className="flex-1 text-sm font-medium text-zinc-100 truncate">GitHub</span>
                <ExternalLink className="w-4 h-4 text-zinc-600" />
              </a>
            )}
          </div>
        </section>
      )}

      {profile?.profile_summary && (
        <section>
          <SectionHeading title="What the AI knows about you" />
          <button
            onClick={() => setShowSummary((v) => !v)}
            className="w-full flex items-center gap-3 px-4 py-3.5 bg-zinc-900/40 border-y border-zinc-800/60 active:bg-zinc-900/60"
          >
            <Sparkles className="w-5 h-5 text-violet-400" />
            <span className="flex-1 text-left text-sm font-medium text-zinc-100">
              {showSummary ? 'Hide AI summary' : 'View AI summary'}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-zinc-500 transition-transform ${showSummary ? 'rotate-180' : ''}`}
            />
          </button>
          {showSummary && (
            <div className="px-4 py-4 bg-zinc-950 border-b border-zinc-800/60">
              <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
                {profile.profile_summary}
              </p>
            </div>
          )}
        </section>
      )}

      <section>
        <SectionHeading title="Account" />
        <div className="bg-zinc-900/40 divide-y divide-zinc-800/60 border-y border-zinc-800/60">
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
          <SettingsRow
            icon={Briefcase}
            label="Skill (legacy)"
            trailing={<span className="text-xs text-zinc-500 truncate max-w-40">{profile?.skill ?? '—'}</span>}
          />
        </div>
      </section>

      <section>
        <SectionHeading title="Settings" />
        <div className="bg-zinc-900/40 divide-y divide-zinc-800/60 border-y border-zinc-800/60">
          <SettingsRow icon={Bell} label="Notifications" onClick={() => toast('Coming soon')} />
          <SettingsRow icon={CreditCard} label="Pricing & plan" href="/pricing" />
          <SettingsRow icon={Shield} label="Privacy policy" href="/privacy" />
          <SettingsRow icon={FileText} label="Terms" href="/terms" />
          <SettingsRow icon={HelpCircle} label="Help" onClick={() => toast('Coming soon')} />
        </div>
      </section>

      <section>
        <SectionHeading title="Danger zone" />
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
          {!deleteAccountOpen ? (
            <SettingsRow
              icon={UserX}
              label="Delete my account"
              onClick={() => setDeleteAccountOpen(true)}
              destructive
              trailing={<span className="text-xs text-red-400/60">Permanent</span>}
            />
          ) : (
            <div className="p-4 bg-red-950/30">
              <div className="flex items-start gap-3 mb-3">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-zinc-100 mb-1">Permanently delete account?</p>
                  <p className="text-xs text-zinc-400">
                    Removes everything: profile, resume, portfolio, leads, pitches, Gmail
                    connection. Signing back in starts a brand-new account.
                  </p>
                </div>
              </div>
              <div className="space-y-1.5 mb-3">
                <p className="text-xs text-zinc-400">
                  Type <span className="font-mono font-bold text-red-300">DELETE</span> to confirm
                </p>
                <input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  disabled={deletingAccount}
                  className="w-full h-10 rounded-lg bg-zinc-950 border border-zinc-800 px-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-red-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setDeleteAccountOpen(false)
                    setDeleteConfirmText('')
                  }}
                  disabled={deletingAccount}
                  className="flex-1 h-10 rounded-lg bg-zinc-800 active:bg-zinc-700 text-zinc-100 font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deletingAccount || deleteConfirmText !== 'DELETE'}
                  className="flex-1 h-10 inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-600 active:bg-red-700 text-white font-medium text-sm disabled:opacity-50"
                >
                  {deletingAccount && <Loader2 className="w-4 h-4 animate-spin" />}
                  {deletingAccount ? 'Deleting…' : 'Delete forever'}
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
