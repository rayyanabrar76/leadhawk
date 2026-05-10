'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Loader2, Check, Plus, LogOut, Trash2, AlertTriangle, UserX,
  User2, DollarSign, Code2, Building, Briefcase, Link2, FileText,
  Upload, X, ExternalLink,
} from 'lucide-react'

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
}

const TECH_SUGGESTIONS = [
  'React', 'Next.js', 'TypeScript', 'Node.js', 'Python', 'Django', 'Rails',
  'PostgreSQL', 'MongoDB', 'AWS', 'Vercel', 'Tailwind', 'GraphQL', 'Docker',
  'Kubernetes', 'Vue', 'Angular', 'Svelte', 'Go', 'Rust', 'Swift', 'Kotlin',
]
const INDUSTRY_SUGGESTIONS = [
  'SaaS', 'Fintech', 'E-commerce', 'Healthtech', 'Edtech', 'Marketplaces',
  'Gaming', 'AI/ML', 'DevTools', 'Real Estate', 'Travel', 'Media',
]
const ENGAGEMENT_OPTIONS = ['Hourly', 'Project', 'Retainer', 'Full-time']

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 pt-1">
      <div className="h-px flex-1 bg-zinc-800/60" />
      <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-semibold">{label}</span>
      <div className="h-px flex-1 bg-zinc-800/60" />
    </div>
  )
}

function Section({
  title,
  icon: Icon,
  description,
  saved,
  saving,
  saveDisabled,
  onSave,
  children,
  destructive,
}: {
  title: string
  icon?: React.ElementType
  description?: string
  saved?: boolean
  saving?: boolean
  saveDisabled?: boolean
  onSave?: () => void
  children: React.ReactNode
  destructive?: boolean
}) {
  return (
    <section
      className={`rounded-xl border ${
        destructive ? 'border-red-900/40 bg-red-950/10' : 'border-zinc-800 bg-zinc-950'
      }`}
    >
      <div className={`px-5 py-3.5 border-b ${destructive ? 'border-red-900/30' : 'border-zinc-800/60'} flex items-center justify-between gap-3`}>
        <div className="flex items-center gap-2.5 min-w-0">
          {Icon && (
            <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
              destructive ? 'bg-red-950/60' : 'bg-zinc-800/80'
            }`}>
              <Icon className={`w-3.5 h-3.5 ${destructive ? 'text-red-400' : 'text-zinc-400'}`} />
            </div>
          )}
          <div className="min-w-0">
            <h2 className={`text-sm font-semibold ${destructive ? 'text-red-300' : 'text-zinc-100'}`}>
              {title}
            </h2>
            {description && (
              <p className="text-xs text-zinc-500 mt-0.5 leading-tight">{description}</p>
            )}
          </div>
        </div>
        {onSave && (
          <Button
            size="sm"
            onClick={onSave}
            disabled={saving || saveDisabled}
            className="bg-zinc-100 text-zinc-950 hover:bg-white h-7 text-xs px-3 shrink-0 disabled:opacity-30"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : saved ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1" />
                Saved
              </>
            ) : (
              'Save'
            )}
          </Button>
        )}
      </div>
      <div className="px-5 py-4 space-y-4">{children}</div>
    </section>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Label className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold">
      {children}
    </Label>
  )
}

function ChipPicker({
  options,
  selected,
  onToggle,
  allowCustom,
}: {
  options: string[]
  selected: string[]
  onToggle: (v: string) => void
  allowCustom?: boolean
}) {
  const [custom, setCustom] = useState('')

  function addCustom() {
    const v = custom.trim()
    if (v && !selected.includes(v)) onToggle(v)
    setCustom('')
  }

  const customSelected = selected.filter((s) => !options.includes(s))
  const allOptions = [...customSelected, ...options]

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {allOptions.map((opt) => {
          const isSelected = selected.includes(opt)
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onToggle(opt)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                isSelected
                  ? 'bg-violet-500/15 text-violet-300 border-violet-500/40'
                  : 'bg-zinc-800/50 text-zinc-300 border-zinc-700 hover:border-zinc-500'
              }`}
            >
              {isSelected && <Check className="w-3 h-3" />}
              {opt}
            </button>
          )
        })}
      </div>
      {allowCustom && (
        <div className="flex gap-2">
          <Input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="Add your own…"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addCustom()
              }
            }}
            className="text-sm h-9 flex-1"
          />
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={addCustom}
            disabled={!custom.trim()}
            className="h-9"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

type SectionKey = 'basics' | 'rates' | 'tech' | 'industries' | 'engagement' | 'links'

export function SettingsClient({ email, profile, portfolio: initialPortfolio }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [bio, setBio] = useState(profile?.bio ?? '')
  const [yearsExp, setYearsExp] = useState(profile?.years_experience?.toString() ?? '')

  const [rateMin, setRateMin] = useState(profile?.hourly_rate_min?.toString() ?? '')
  const [rateMax, setRateMax] = useState(profile?.hourly_rate_max?.toString() ?? '')

  const [techStack, setTechStack] = useState<string[]>(profile?.tech_stack ?? [])
  const [industries, setIndustries] = useState<string[]>(profile?.industries ?? [])
  const [engagement, setEngagement] = useState<string[]>(profile?.preferred_engagement ?? [])

  const [portfolioUrl, setPortfolioUrl] = useState(profile?.portfolio_url ?? '')
  const [linkedinUrl, setLinkedinUrl] = useState(profile?.linkedin_url ?? '')
  const [githubUrl, setGithubUrl] = useState(profile?.github_url ?? '')

  const [resumeName, setResumeName] = useState(profile?.resume_filename ?? null)
  const [uploadingResume, setUploadingResume] = useState(false)

  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>(initialPortfolio)
  const [showAddItem, setShowAddItem] = useState(false)
  const [newItem, setNewItem] = useState({ title: '', url: '', description: '', outcome: '' })
  const [savingItem, setSavingItem] = useState(false)

  const [savingKey, setSavingKey] = useState<SectionKey | null>(null)
  const [savedKey, setSavedKey] = useState<SectionKey | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  async function handleSignOut() {
    setSigningOut(true)
    await supabase.auth.signOut()
    router.replace('/')
  }

  async function handleClearLeads() {
    setClearing(true)
    try {
      const res = await fetch('/api/leads/clear', { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Clear failed')
      toast.success(`Cleared ${data.deleted ?? 0} leads`)
      setConfirming(false)
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
      toast.success('Resume saved')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    }
    setUploadingResume(false)
  }

  async function handleAddPortfolioItem() {
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
      setPortfolioItems((p) => [data.item, ...p])
      setNewItem({ title: '', url: '', description: '', outcome: '' })
      setShowAddItem(false)
      toast.success('Project added')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
    }
    setSavingItem(false)
  }

  async function handleDeletePortfolioItem(id: string) {
    const prev = portfolioItems
    setPortfolioItems((p) => p.filter((it) => it.id !== id))
    try {
      const res = await fetch(`/api/profile/portfolio/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      toast.success('Removed')
    } catch {
      setPortfolioItems(prev)
      toast.error('Could not remove')
    }
  }

  function toggle(arr: string[], v: string): string[] {
    return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]
  }

  function arrEq(a: string[], b: string[]) {
    return [...a].sort().join() === [...b].sort().join()
  }

  const dirtyBasics =
    bio !== (profile?.bio ?? '') ||
    yearsExp !== (profile?.years_experience?.toString() ?? '')
  const dirtyRates =
    rateMin !== (profile?.hourly_rate_min?.toString() ?? '') ||
    rateMax !== (profile?.hourly_rate_max?.toString() ?? '')
  const dirtyTech = !arrEq(techStack, profile?.tech_stack ?? [])
  const dirtyIndustries = !arrEq(industries, profile?.industries ?? [])
  const dirtyEngagement = !arrEq(engagement, profile?.preferred_engagement ?? [])
  const dirtyLinks =
    portfolioUrl !== (profile?.portfolio_url ?? '') ||
    linkedinUrl !== (profile?.linkedin_url ?? '') ||
    githubUrl !== (profile?.github_url ?? '')

  async function saveSection(
    key: SectionKey,
    body: Record<string, unknown>,
    options: { skipSummary?: boolean } = {}
  ) {
    setSavingKey(key)
    setSavedKey(null)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, skip_summary: options.skipSummary }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Save failed')
      }
      setSavedKey(key)
      toast.success('Saved')
      router.refresh()
      setTimeout(() => setSavedKey((k) => (k === key ? null : k)), 1800)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSavingKey(null)
    }
  }

  return (
    <div className="space-y-3">
      <Toaster position="top-center" theme="dark" />

      {/* Account header */}
      <div className="rounded-xl border border-zinc-800 bg-linear-to-br from-zinc-950 to-zinc-900 px-5 py-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-linear-to-br from-violet-500 to-violet-700 text-white text-sm font-bold flex items-center justify-center shrink-0 shadow-lg shadow-violet-900/30">
          {email.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold">Signed in as</p>
          <p className="text-sm text-zinc-100 mt-0.5 truncate">{email}</p>
        </div>
      </div>

      <SectionDivider label="Profile" />

      {/* About you */}
      <Section
        title="About you"
        icon={User2}
        description="Used by AI to write better pitches."
        saved={savedKey === 'basics'}
        saving={savingKey === 'basics'}
        saveDisabled={!dirtyBasics}
        onSave={() =>
          saveSection('basics', {
            bio: bio.trim() || null,
            years_experience: yearsExp ? Number(yearsExp) : null,
          })
        }
      >
        <div className="space-y-1.5">
          <FieldLabel>Bio</FieldLabel>
          <Textarea
            rows={5}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="3-5 sentences on what you do, who you do it for, and what makes you good at it."
          />
        </div>
        <div className="space-y-1.5">
          <FieldLabel>Years of experience</FieldLabel>
          <Input
            type="number"
            min="0"
            max="60"
            value={yearsExp}
            onChange={(e) => setYearsExp(e.target.value)}
            placeholder="5"
            className="max-w-32"
          />
        </div>
      </Section>

      {/* Rate */}
      <Section
        title="Hourly rate"
        icon={DollarSign}
        description="Your comfortable working range."
        saved={savedKey === 'rates'}
        saving={savingKey === 'rates'}
        saveDisabled={!dirtyRates}
        onSave={() =>
          saveSection(
            'rates',
            {
              hourly_rate_min: rateMin ? Number(rateMin) : null,
              hourly_rate_max: rateMax ? Number(rateMax) : null,
            },
            { skipSummary: true }
          )
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <FieldLabel>Min ($/hr)</FieldLabel>
            <Input
              type="number"
              min="0"
              value={rateMin}
              onChange={(e) => setRateMin(e.target.value)}
              placeholder="80"
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Max ($/hr)</FieldLabel>
            <Input
              type="number"
              min="0"
              value={rateMax}
              onChange={(e) => setRateMax(e.target.value)}
              placeholder="120"
            />
          </div>
        </div>
      </Section>

      {/* Tech */}
      <Section
        title="Tech stack"
        icon={Code2}
        description="What you actually ship."
        saved={savedKey === 'tech'}
        saving={savingKey === 'tech'}
        saveDisabled={!dirtyTech}
        onSave={() =>
          saveSection('tech', {
            tech_stack: techStack.length ? techStack : null,
          })
        }
      >
        <ChipPicker
          options={TECH_SUGGESTIONS}
          selected={techStack}
          onToggle={(v) => setTechStack((cur) => toggle(cur, v))}
          allowCustom
        />
      </Section>

      {/* Industries */}
      <Section
        title="Industries"
        icon={Building}
        description="Domains you have experience in."
        saved={savedKey === 'industries'}
        saving={savingKey === 'industries'}
        saveDisabled={!dirtyIndustries}
        onSave={() =>
          saveSection('industries', {
            industries: industries.length ? industries : null,
          })
        }
      >
        <ChipPicker
          options={INDUSTRY_SUGGESTIONS}
          selected={industries}
          onToggle={(v) => setIndustries((cur) => toggle(cur, v))}
          allowCustom
        />
      </Section>

      {/* Engagement */}
      <Section
        title="Preferred engagement"
        icon={Briefcase}
        description="What kind of work you're open to."
        saved={savedKey === 'engagement'}
        saving={savingKey === 'engagement'}
        saveDisabled={!dirtyEngagement}
        onSave={() =>
          saveSection('engagement', {
            preferred_engagement: engagement.length ? engagement : null,
          })
        }
      >
        <ChipPicker
          options={ENGAGEMENT_OPTIONS}
          selected={engagement}
          onToggle={(v) => setEngagement((cur) => toggle(cur, v))}
        />
      </Section>

      {/* Links */}
      <Section
        title="Links"
        icon={Link2}
        description="AI references these in pitches."
        saved={savedKey === 'links'}
        saving={savingKey === 'links'}
        saveDisabled={!dirtyLinks}
        onSave={() =>
          saveSection(
            'links',
            {
              portfolio_url: portfolioUrl.trim() || null,
              linkedin_url: linkedinUrl.trim() || null,
              github_url: githubUrl.trim() || null,
            },
            { skipSummary: true }
          )
        }
      >
        <div className="space-y-1.5">
          <FieldLabel>Portfolio</FieldLabel>
          <Input
            type="url"
            value={portfolioUrl}
            onChange={(e) => setPortfolioUrl(e.target.value)}
            placeholder="https://yourname.com"
          />
        </div>
        <div className="space-y-1.5">
          <FieldLabel>LinkedIn</FieldLabel>
          <Input
            type="url"
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            placeholder="https://linkedin.com/in/you"
          />
        </div>
        <div className="space-y-1.5">
          <FieldLabel>GitHub</FieldLabel>
          <Input
            type="url"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            placeholder="https://github.com/you"
          />
        </div>
      </Section>

      {/* Resume */}
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
      <Section title="Resume" icon={Upload} description="PDF or DOCX, max 5MB.">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingResume}
          className="w-full flex items-center gap-3 -mx-5 px-5 py-2 hover:bg-zinc-900/60 transition-colors disabled:opacity-50 rounded-b-xl"
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
              {resumeName ?? 'No resume uploaded'}
            </p>
            <p className="text-xs text-zinc-500">
              {uploadingResume ? 'Parsing…' : resumeName ? 'Click to replace' : 'Click to upload'}
            </p>
          </div>
        </button>
      </Section>

      {/* Portfolio */}
      <Section
        title="Portfolio"
        icon={FileText}
        description="Projects improve pitch quality."
        onSave={showAddItem ? handleAddPortfolioItem : undefined}
        saving={savingItem}
      >
        {showAddItem && (
          <div className="space-y-2.5 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3.5">
            <Input
              value={newItem.title}
              onChange={(e) => setNewItem((n) => ({ ...n, title: e.target.value }))}
              placeholder="Project title"
            />
            <Input
              type="url"
              value={newItem.url}
              onChange={(e) => setNewItem((n) => ({ ...n, url: e.target.value }))}
              placeholder="URL (optional)"
            />
            <Input
              value={newItem.description}
              onChange={(e) => setNewItem((n) => ({ ...n, description: e.target.value }))}
              placeholder="2-3 sentences on what you built"
            />
            <Input
              value={newItem.outcome}
              onChange={(e) => setNewItem((n) => ({ ...n, outcome: e.target.value }))}
              placeholder="Outcome (e.g. cut load time 40%)"
            />
          </div>
        )}

        {portfolioItems.length === 0 && !showAddItem && (
          <p className="text-sm text-zinc-500">No projects yet.</p>
        )}

        {portfolioItems.map((item) => (
          <div key={item.id} className="flex items-start gap-3 -mx-5 px-5 py-2">
            <FileText className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-zinc-100 truncate flex-1">{item.title}</p>
                {item.url && (
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-violet-400">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
              {item.outcome && <p className="text-xs text-violet-300/80 mt-0.5">→ {item.outcome}</p>}
            </div>
            <button onClick={() => handleDeletePortfolioItem(item.id)} className="p-1 text-zinc-600 hover:text-red-400 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        <button
          onClick={() => setShowAddItem((v) => !v)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-400 hover:text-violet-300 transition-colors"
        >
          {showAddItem ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
          {showAddItem ? 'Cancel' : 'Add project'}
        </button>
      </Section>

      <SectionDivider label="Account" />

      {/* Sign out */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full flex items-center gap-3 px-5 py-4 text-sm text-zinc-200 hover:bg-zinc-900/80 transition-colors disabled:opacity-50"
        >
          <div className="w-7 h-7 rounded-md bg-zinc-800/80 flex items-center justify-center shrink-0">
            {signingOut
              ? <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
              : <LogOut className="w-3.5 h-3.5 text-zinc-400" />
            }
          </div>
          <span className="font-medium">{signingOut ? 'Signing out…' : 'Sign out of LeadHawk'}</span>
        </button>
      </div>

      {/* Danger zone */}
      <Section title="Danger zone" icon={AlertTriangle} description="These actions are permanent." destructive>
        {/* Clear leads */}
        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            className="w-full inline-flex items-center justify-between text-sm text-red-300 hover:bg-red-950/30 -mx-5 px-5 py-2 transition-colors"
          >
            <span className="inline-flex items-center gap-2">
              <Trash2 className="w-4 h-4 shrink-0" />
              Clear all leads
            </span>
            <span className="text-xs text-red-400/60 font-medium">Irreversible</span>
          </button>
        ) : (
          <div className="rounded-lg border border-red-900/40 bg-red-950/30 p-3.5 space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-zinc-100">Delete all leads?</p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Permanently deletes every lead and pitch. Your profile stays.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 hover:bg-zinc-800 h-8"
                onClick={() => setConfirming(false)}
                disabled={clearing}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-red-600 hover:bg-red-500 text-white h-8"
                onClick={handleClearLeads}
                disabled={clearing}
              >
                {clearing && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                {clearing ? 'Deleting…' : 'Yes, delete'}
              </Button>
            </div>
          </div>
        )}

        {/* Delete account */}
        <div id="delete-account" className="scroll-mt-20">
          {!deleteConfirmOpen ? (
            <button
              onClick={() => setDeleteConfirmOpen(true)}
              className="w-full inline-flex items-center justify-between text-sm text-red-300 hover:bg-red-950/30 -mx-5 px-5 py-2 transition-colors"
            >
              <span className="inline-flex items-center gap-2">
                <UserX className="w-4 h-4 shrink-0" />
                Delete my account
              </span>
              <span className="text-xs text-red-400/60 font-medium">Permanent</span>
            </button>
          ) : (
            <div className="rounded-lg border border-red-900/60 bg-red-950/40 p-3.5 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-zinc-100">Permanently delete account?</p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Removes everything: profile, resume, portfolio, leads, pitches, Gmail
                    connection. Signing back in starts a brand-new account.
                  </p>
                </div>
              </div>
              <div className="space-y-1.5">
                <FieldLabel>
                  Type <span className="font-mono font-bold text-red-300 normal-case tracking-normal">DELETE</span> to confirm
                </FieldLabel>
                <Input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  disabled={deletingAccount}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 hover:bg-zinc-800 h-8"
                  onClick={() => {
                    setDeleteConfirmOpen(false)
                    setDeleteConfirmText('')
                  }}
                  disabled={deletingAccount}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white h-8"
                  onClick={handleDeleteAccount}
                  disabled={deletingAccount || deleteConfirmText !== 'DELETE'}
                >
                  {deletingAccount && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                  {deletingAccount ? 'Deleting…' : 'Delete account forever'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Section>
    </div>
  )
}
