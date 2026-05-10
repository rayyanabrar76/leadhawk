'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Check, Plus, LogOut, Trash2, AlertTriangle, UserX } from 'lucide-react'

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

interface Props {
  email: string
  profile: ProfileShape | null
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

function Section({
  title,
  description,
  saved,
  saving,
  onSave,
  children,
  destructive,
}: {
  title: string
  description?: string
  saved?: boolean
  saving?: boolean
  onSave?: () => void
  children: React.ReactNode
  destructive?: boolean
}) {
  return (
    <section
      className={`rounded-lg border ${
        destructive ? 'border-red-900/40 bg-red-950/10' : 'border-zinc-800 bg-zinc-950'
      }`}
    >
      <div className="px-5 py-4 border-b border-zinc-800/60 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className={`text-sm font-semibold ${destructive ? 'text-red-300' : 'text-zinc-100'}`}>
            {title}
          </h2>
          {description && (
            <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
          )}
        </div>
        {onSave && (
          <Button
            size="sm"
            onClick={onSave}
            disabled={saving}
            className="bg-zinc-100 text-zinc-950 hover:bg-white h-7 text-xs px-3 shrink-0"
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
      <div className="px-5 py-4 space-y-3">{children}</div>
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

export function SettingsClient({ email, profile }: Props) {
  const router = useRouter()
  const supabase = createClient()

  // Per-section edit state. Persisted values come from the loaded profile.
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
      // Hard refresh so any cached session/cookies are dropped
      window.location.href = '/'
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete account')
      setDeletingAccount(false)
    }
  }

  function toggle(arr: string[], v: string): string[] {
    return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]
  }

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
      // Clear "Saved" indicator after a moment
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

      <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold">Signed in as</p>
          <p className="text-sm text-zinc-100 mt-0.5">{email}</p>
        </div>
        <span className="w-9 h-9 rounded-full bg-violet-600 text-white text-xs font-bold flex items-center justify-center">
          {email.slice(0, 2).toUpperCase()}
        </span>
      </div>

      {/* Basics */}
      <Section
        title="About you"
        description="Bio + years of experience. Used by the AI to write better pitches."
        saved={savedKey === 'basics'}
        saving={savingKey === 'basics'}
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
        description="Min and max range you're comfortable working at."
        saved={savedKey === 'rates'}
        saving={savingKey === 'rates'}
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
        description="What you actually ship. Pick from the list or add your own."
        saved={savedKey === 'tech'}
        saving={savingKey === 'tech'}
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
        description="Domains you have experience in."
        saved={savedKey === 'industries'}
        saving={savingKey === 'industries'}
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
        description="What kind of work you're open to."
        saved={savedKey === 'engagement'}
        saving={savingKey === 'engagement'}
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
        description="Used by the AI to reference your work."
        saved={savedKey === 'links'}
        saving={savingKey === 'links'}
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

      <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-5 py-4">
        <p className="text-xs text-zinc-500">
          Resume upload and portfolio items are managed on{' '}
          <a href="/profile" className="text-violet-400 hover:underline">
            your profile page
          </a>
          .
        </p>
      </div>

      {/* Account actions */}
      <Section title="Sign out">
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full inline-flex items-center justify-between text-sm text-zinc-200 hover:bg-zinc-900 -mx-5 px-5 py-2 disabled:opacity-50"
        >
          <span className="inline-flex items-center">
            {signingOut ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4 mr-2 text-zinc-400" />
            )}
            Sign out of LeadHawk
          </span>
        </button>
      </Section>

      {/* Danger zone */}
      <Section title="Danger zone" description="These actions are permanent." destructive>
        {/* Clear leads */}
        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            className="w-full inline-flex items-center justify-between text-sm text-red-300 hover:bg-red-950/30 -mx-5 px-5 py-2"
          >
            <span className="inline-flex items-center">
              <Trash2 className="w-4 h-4 mr-2" />
              Clear all leads
            </span>
            <span className="text-xs text-red-400/70">Irreversible</span>
          </button>
        ) : (
          <div className="rounded-md border border-red-900/40 bg-red-950/30 p-3 space-y-3">
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
              className="w-full inline-flex items-center justify-between text-sm text-red-300 hover:bg-red-950/30 -mx-5 px-5 py-2"
            >
              <span className="inline-flex items-center">
                <UserX className="w-4 h-4 mr-2" />
                Delete my account
              </span>
              <span className="text-xs text-red-400/70">Permanent</span>
            </button>
          ) : (
            <div className="rounded-md border border-red-900/60 bg-red-950/40 p-3 space-y-3">
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
