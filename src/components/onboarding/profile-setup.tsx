'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Logo } from '@/components/Logo'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  Upload,
  FileText,
  Plus,
  X,
  Sparkles,
} from 'lucide-react'

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

interface PortfolioItem {
  title: string
  url: string
  description: string
  tech_used: string[]
  outcome: string
}

const EMPTY_ITEM: PortfolioItem = {
  title: '',
  url: '',
  description: '',
  tech_used: [],
  outcome: '',
}

interface FormState {
  bio: string
  years_experience: string
  hourly_rate_min: string
  hourly_rate_max: string
  tech_stack: string[]
  industries: string[]
  preferred_engagement: string[]
  portfolio_url: string
  linkedin_url: string
  github_url: string
  resume_filename: string | null
}

const TOTAL_STEPS = 5

function StepDots({ step }: { step: number }) {
  return (
    <div className="flex gap-1.5 justify-center mb-6">
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <span
          key={i}
          className={`h-1.5 rounded-full transition-all ${
            i + 1 < step
              ? 'w-6 bg-violet-500'
              : i + 1 === step
              ? 'w-6 bg-violet-400'
              : 'w-1.5 bg-zinc-700'
          }`}
        />
      ))}
    </div>
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
    if (v && !selected.includes(v)) {
      onToggle(v)
    }
    setCustom('')
  }

  // Show selected items not in options at the top so users see their custom adds
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

export function ProfileSetup() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormState>({
    bio: '',
    years_experience: '',
    hourly_rate_min: '',
    hourly_rate_max: '',
    tech_stack: [],
    industries: [],
    preferred_engagement: [],
    portfolio_url: '',
    linkedin_url: '',
    github_url: '',
    resume_filename: null,
  })
  const [items, setItems] = useState<PortfolioItem[]>([])
  const [draftItem, setDraftItem] = useState<PortfolioItem>(EMPTY_ITEM)
  const [draftTech, setDraftTech] = useState('')

  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function toggleArray(key: 'tech_stack' | 'industries' | 'preferred_engagement', v: string) {
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(v) ? f[key].filter((x) => x !== v) : [...f[key], v],
    }))
  }

  async function handleResumeUpload(file: File) {
    setUploading(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/profile/resume', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Upload failed')
      update('resume_filename', file.name)
      toast.success('Resume parsed and saved')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    }
    setUploading(false)
  }

  function addPortfolioItem() {
    if (!draftItem.title.trim()) return
    setItems((arr) => [...arr, draftItem])
    setDraftItem(EMPTY_ITEM)
    setDraftTech('')
  }

  function removeItem(idx: number) {
    setItems((arr) => arr.filter((_, i) => i !== idx))
  }

  function canAdvance(): boolean {
    switch (step) {
      case 1:
        return form.bio.trim().length >= 10
      case 2:
        return form.tech_stack.length > 0
      default:
        return true
    }
  }

  async function finish() {
    setSubmitting(true)
    setError('')
    try {
      // 1. Save the core profile fields. /api/profile triggers Gemini summary.
      // We also persist `skill` (used by existing refresh + draft-pitch flows
      // until Phase 2b replaces them) — derive it from tech_stack or bio.
      const skill =
        form.tech_stack[0]
          ? `${form.tech_stack[0]} developer`
          : form.bio.split(/[.\n]/)[0].slice(0, 80)

      const profileBody = {
        bio: form.bio.trim() || null,
        years_experience: form.years_experience ? Number(form.years_experience) : null,
        hourly_rate_min: form.hourly_rate_min ? Number(form.hourly_rate_min) : null,
        hourly_rate_max: form.hourly_rate_max ? Number(form.hourly_rate_max) : null,
        tech_stack: form.tech_stack.length ? form.tech_stack : null,
        industries: form.industries.length ? form.industries : null,
        preferred_engagement: form.preferred_engagement.length
          ? form.preferred_engagement
          : null,
        portfolio_url: form.portfolio_url.trim() || null,
        linkedin_url: form.linkedin_url.trim() || null,
        github_url: form.github_url.trim() || null,
        skill,
        // Skip summary until portfolio items are saved — single Gemini call at the end
        skip_summary: true,
      }

      const profileRes = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileBody),
      })
      if (!profileRes.ok) {
        const d = await profileRes.json().catch(() => ({}))
        throw new Error(d.error ?? 'Could not save profile')
      }

      // 2. Save portfolio items (skip_summary on each so we don't fire Gemini per item)
      for (const it of items) {
        if (!it.title.trim()) continue
        await fetch('/api/profile/portfolio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(it),
        })
      }

      // 3. Final summary regen — single Gemini call after everything is saved
      await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        // Touch a no-op field to force the summary recompute
        body: JSON.stringify({ skill }),
      })

      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Setup failed')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <Toaster position="top-center" theme="dark" />
      <div className="w-full max-w-lg">
        <div className="flex flex-col items-center text-center mb-6">
          <Logo variant="full" size="md" href={null} />
          <p className="mt-3 text-sm text-muted-foreground">
            Set up your profile so we can find leads that actually fit you.
          </p>
        </div>

        <StepDots step={step} />

        <div className="rounded-xl border border-border bg-zinc-900/40 p-6 space-y-5 ring-1 ring-white/5">
          {step === 1 && (
            <>
              <div>
                <h2 className="text-lg font-semibold mb-1">Tell us about yourself</h2>
                <p className="text-xs text-muted-foreground">
                  3-5 sentences on what you do, who you do it for, and what makes you good at it.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea
                  rows={5}
                  value={form.bio}
                  onChange={(e) => update('bio', e.target.value)}
                  placeholder="I build performant Next.js apps for B2B SaaS. Last 3 years I've focused on dashboard UIs and Stripe integrations..."
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">Years experience</Label>
                  <Input
                    type="number"
                    min="0"
                    max="60"
                    value={form.years_experience}
                    onChange={(e) => update('years_experience', e.target.value)}
                    placeholder="5"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Rate min ($/h)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={form.hourly_rate_min}
                    onChange={(e) => update('hourly_rate_min', e.target.value)}
                    placeholder="80"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Rate max ($/h)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={form.hourly_rate_max}
                    onChange={(e) => update('hourly_rate_max', e.target.value)}
                    placeholder="120"
                  />
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <h2 className="text-lg font-semibold mb-1">Skills &amp; domains</h2>
                <p className="text-xs text-muted-foreground">
                  Pick what you actually ship. Add custom tags if we missed something.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Tech stack</Label>
                <ChipPicker
                  options={TECH_SUGGESTIONS}
                  selected={form.tech_stack}
                  onToggle={(v) => toggleArray('tech_stack', v)}
                  allowCustom
                />
              </div>
              <div className="space-y-2">
                <Label>Industries</Label>
                <ChipPicker
                  options={INDUSTRY_SUGGESTIONS}
                  selected={form.industries}
                  onToggle={(v) => toggleArray('industries', v)}
                  allowCustom
                />
              </div>
              <div className="space-y-2">
                <Label>Preferred engagement</Label>
                <ChipPicker
                  options={ENGAGEMENT_OPTIONS}
                  selected={form.preferred_engagement}
                  onToggle={(v) => toggleArray('preferred_engagement', v)}
                />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <h2 className="text-lg font-semibold mb-1">Links</h2>
                <p className="text-xs text-muted-foreground">All optional but they help the AI write better pitches.</p>
              </div>
              <div className="space-y-2">
                <Label>Portfolio</Label>
                <Input
                  type="url"
                  value={form.portfolio_url}
                  onChange={(e) => update('portfolio_url', e.target.value)}
                  placeholder="https://yourname.com"
                />
              </div>
              <div className="space-y-2">
                <Label>LinkedIn</Label>
                <Input
                  type="url"
                  value={form.linkedin_url}
                  onChange={(e) => update('linkedin_url', e.target.value)}
                  placeholder="https://linkedin.com/in/you"
                />
              </div>
              <div className="space-y-2">
                <Label>GitHub</Label>
                <Input
                  type="url"
                  value={form.github_url}
                  onChange={(e) => update('github_url', e.target.value)}
                  placeholder="https://github.com/you"
                />
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div>
                <h2 className="text-lg font-semibold mb-1">Upload your resume</h2>
                <p className="text-xs text-muted-foreground">
                  PDF or DOCX, up to 5MB. We extract text only (no formatting). Heavily recommended — pitches get much better.
                </p>
              </div>
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
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full flex flex-col items-center justify-center py-10 rounded-lg border-2 border-dashed border-zinc-700 hover:border-violet-500/50 hover:bg-zinc-800/30 transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-7 h-7 text-violet-400 mb-2 animate-spin" />
                    <p className="text-sm text-zinc-300 font-medium">Parsing resume…</p>
                  </>
                ) : form.resume_filename ? (
                  <>
                    <Check className="w-7 h-7 text-green-400 mb-2" />
                    <p className="text-sm text-zinc-100 font-medium">{form.resume_filename}</p>
                    <p className="text-xs text-violet-400 mt-1">Click to replace</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-7 h-7 text-zinc-500 mb-2" />
                    <p className="text-sm text-zinc-300 font-medium">Drop or click to upload</p>
                    <p className="text-xs text-zinc-500 mt-1">PDF or DOCX, max 5MB</p>
                  </>
                )}
              </button>
            </>
          )}

          {step === 5 && (
            <>
              <div>
                <h2 className="text-lg font-semibold mb-1">Portfolio items</h2>
                <p className="text-xs text-muted-foreground">
                  Add 3-5 of your best projects. Skip if you want — but pitches reference these.
                </p>
              </div>

              {items.length > 0 && (
                <ul className="space-y-2">
                  {items.map((it, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3"
                    >
                      <FileText className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-100 truncate">{it.title}</p>
                        {it.outcome && (
                          <p className="text-xs text-zinc-400 truncate">Result: {it.outcome}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="p-1 text-zinc-500 hover:text-red-400"
                        aria-label="Remove"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="space-y-2 rounded-lg border border-zinc-800 p-3 bg-zinc-900/30">
                <Input
                  value={draftItem.title}
                  onChange={(e) => setDraftItem((d) => ({ ...d, title: e.target.value }))}
                  placeholder="Project title (e.g. Stripe checkout for $50M DTC brand)"
                />
                <Input
                  type="url"
                  value={draftItem.url}
                  onChange={(e) => setDraftItem((d) => ({ ...d, url: e.target.value }))}
                  placeholder="https://link-to-project (optional)"
                />
                <Textarea
                  rows={2}
                  value={draftItem.description}
                  onChange={(e) => setDraftItem((d) => ({ ...d, description: e.target.value }))}
                  placeholder="2-3 sentences on what you built and why"
                />
                <div className="flex flex-wrap gap-1.5">
                  {draftItem.tech_used.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() =>
                        setDraftItem((d) => ({
                          ...d,
                          tech_used: d.tech_used.filter((x) => x !== t),
                        }))
                      }
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-violet-500/15 text-violet-300 border border-violet-500/30"
                    >
                      {t}
                      <X className="w-3 h-3" />
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={draftTech}
                    onChange={(e) => setDraftTech(e.target.value)}
                    placeholder="Tech used (press Enter)"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && draftTech.trim()) {
                        e.preventDefault()
                        const v = draftTech.trim()
                        if (!draftItem.tech_used.includes(v)) {
                          setDraftItem((d) => ({ ...d, tech_used: [...d.tech_used, v] }))
                        }
                        setDraftTech('')
                      }
                    }}
                    className="text-sm h-9 flex-1"
                  />
                </div>
                <Input
                  value={draftItem.outcome}
                  onChange={(e) => setDraftItem((d) => ({ ...d, outcome: e.target.value }))}
                  placeholder="Outcome (e.g. cut checkout abandonment 23%)"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addPortfolioItem}
                  disabled={!draftItem.title.trim()}
                  className="w-full h-8"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Add project
                </Button>
              </div>
            </>
          )}

          {error && (
            <div className="rounded-md bg-red-950/50 border border-red-900/50 p-3 text-sm text-red-400">
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-5">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1 || submitting}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>

          {step < TOTAL_STEPS ? (
            <Button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canAdvance() || uploading}
              className="bg-violet-600 hover:bg-violet-700"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={finish}
              disabled={submitting}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Generating profile…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  Finish &amp; find leads
                </>
              )}
            </Button>
          )}
        </div>

        <p className="text-center text-xs text-zinc-500 mt-4">
          Step {step} of {TOTAL_STEPS}
          {step >= 4 && ' · You can skip and add later from /profile'}
        </p>
      </div>
    </div>
  )
}
