'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Logo } from '@/components/Logo'
import { toast } from 'sonner'
import {
  Loader2,
  Check,
  Plus,
  FileText,
  ChevronRight,
  Pencil,
  Sparkles,
  Upload,
  ArrowLeft,
  User2,
  Code2,
  Building,
  Briefcase,
  Link2,
} from 'lucide-react'
import type { ExtractedProfile } from '@/lib/ai/extract-profile-from-resume'

interface InitialProfile {
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
}

interface Props {
  initialProfile: InitialProfile | null
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

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Label className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold">
      {children}
    </Label>
  )
}

function CardHeader({
  icon: Icon,
  title,
  description,
  iconColor,
}: {
  icon: React.ElementType
  title: string
  description?: string
  iconColor?: string
}) {
  return (
    <div className="px-5 py-3.5 border-b border-zinc-800/60 flex items-center gap-2.5">
      <div className="w-7 h-7 rounded-md bg-zinc-800/80 flex items-center justify-center shrink-0">
        <Icon className={`w-3.5 h-3.5 ${iconColor ?? 'text-zinc-400'}`} />
      </div>
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-zinc-100">{title}</h2>
        {description && <p className="text-xs text-zinc-500 mt-0.5 leading-tight">{description}</p>}
      </div>
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
              if (e.key === 'Enter') { e.preventDefault(); addCustom() }
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

type Phase = 'choice' | 'extracting' | 'form'

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

function profileToForm(p: InitialProfile | ExtractedProfile | null): FormState {
  return {
    bio: p?.bio ?? '',
    years_experience: p?.years_experience?.toString() ?? '',
    hourly_rate_min: p?.hourly_rate_min?.toString() ?? '',
    hourly_rate_max: p?.hourly_rate_max?.toString() ?? '',
    tech_stack: p?.tech_stack ?? [],
    industries: p?.industries ?? [],
    preferred_engagement: p?.preferred_engagement ?? [],
    portfolio_url: p?.portfolio_url ?? '',
    linkedin_url: p?.linkedin_url ?? '',
    github_url: p?.github_url ?? '',
    resume_filename: null,
  }
}

export function ProfileSetup({ initialProfile }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const hasExistingData = Boolean(
    initialProfile?.bio || (initialProfile?.tech_stack && initialProfile.tech_stack.length > 0)
  )

  const [phase, setPhase] = useState<Phase>(hasExistingData ? 'form' : 'choice')
  const [form, setForm] = useState<FormState>(profileToForm(initialProfile))
  const [extractError, setExtractError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

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
    setPhase('extracting')
    setExtractError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/profile/resume?extract=true', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Upload failed')
      const extracted: ExtractedProfile = data.extracted
      setForm({ ...profileToForm(extracted), resume_filename: file.name })
      toast.success('Profile extracted from resume')
      setPhase('form')
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : 'Upload failed')
      setPhase('choice')
    }
  }

  async function handleSubmit() {
    if (form.bio.trim().length < 10) {
      setSubmitError('Please write a short bio (at least 10 characters).')
      return
    }
    if (form.tech_stack.length === 0) {
      setSubmitError('Please select at least one tech skill.')
      return
    }

    setSubmitting(true)
    setSubmitError('')
    try {
      const skill =
        form.tech_stack[0]
          ? `${form.tech_stack[0]} developer`
          : form.bio.split(/[.\n]/)[0].slice(0, 80)

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio: form.bio.trim() || null,
          years_experience: form.years_experience ? Number(form.years_experience) : null,
          hourly_rate_min: form.hourly_rate_min ? Number(form.hourly_rate_min) : null,
          hourly_rate_max: form.hourly_rate_max ? Number(form.hourly_rate_max) : null,
          tech_stack: form.tech_stack.length ? form.tech_stack : null,
          industries: form.industries.length ? form.industries : null,
          preferred_engagement: form.preferred_engagement.length ? form.preferred_engagement : null,
          portfolio_url: form.portfolio_url.trim() || null,
          linkedin_url: form.linkedin_url.trim() || null,
          github_url: form.github_url.trim() || null,
          skill,
        }),
      })

      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error ?? 'Could not save profile')
      }
      router.push('/dashboard')
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Setup failed')
      setSubmitting(false)
    }
  }

  // ── Choice screen ──────────────────────────────────────────────
  if (phase === 'choice' || phase === 'extracting') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
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

        <div className="w-full max-w-md">
          <div className="flex flex-col items-center text-center mb-10">
            <Logo variant="full" size="md" href={null} />
            <h1 className="text-xl font-bold text-zinc-100 mt-5">Set up your profile</h1>
            <p className="text-sm text-zinc-400 mt-2">How do you want to start?</p>
          </div>

          <div className="space-y-3">
            {/* Upload resume */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={phase === 'extracting'}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-5 text-left hover:bg-zinc-900/80 hover:border-violet-500/40 transition-all disabled:opacity-60 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-violet-500/15 flex items-center justify-center shrink-0">
                  {phase === 'extracting'
                    ? <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
                    : <FileText className="w-5 h-5 text-violet-400" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-100">
                    {phase === 'extracting' ? 'Reading your resume…' : 'Upload your resume'}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {phase === 'extracting'
                      ? 'AI is extracting your skills and experience'
                      : 'PDF or DOCX · AI fills your profile automatically'
                    }
                  </p>
                </div>
                {phase !== 'extracting' && (
                  <ChevronRight className="w-4 h-4 text-zinc-600 shrink-0" />
                )}
              </div>
            </button>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-zinc-800" />
              <span className="text-xs text-zinc-600 font-medium">or</span>
              <div className="h-px flex-1 bg-zinc-800" />
            </div>

            {/* Fill manually */}
            <button
              type="button"
              onClick={() => setPhase('form')}
              disabled={phase === 'extracting'}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-5 text-left hover:bg-zinc-900/80 hover:border-zinc-700 transition-all disabled:opacity-40"
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-zinc-800/80 flex items-center justify-center shrink-0">
                  <Pencil className="w-5 h-5 text-zinc-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-100">Fill manually</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Add your bio, skills, and rates yourself</p>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-600 shrink-0" />
              </div>
            </button>
          </div>

          {extractError && (
            <p className="text-sm text-red-400 text-center mt-4">{extractError}</p>
          )}
        </div>
      </div>
    )
  }

  // ── Settings-style form ────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {hasExistingData ? (
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          ) : (
            <button
              onClick={() => setPhase('choice')}
              className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          )}
          <Logo variant="full" size="sm" href={null} />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-20 space-y-3">
        {form.resume_filename && (
          <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-5 py-3.5 flex items-center gap-3">
            <Check className="w-4 h-4 text-violet-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-violet-200 truncate">
                Resume uploaded: {form.resume_filename}
              </p>
              <p className="text-xs text-violet-400/70 mt-0.5">Profile pre-filled — review and adjust below</p>
            </div>
          </div>
        )}

        {/* About you */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-950">
          <CardHeader icon={User2} title="About you" description="Required. Used by AI to write better pitches." iconColor="text-violet-400" />
          <div className="px-5 py-4 space-y-4">
            <div className="space-y-1.5">
              <FieldLabel>Bio <span className="text-red-400">*</span></FieldLabel>
              <Textarea
                rows={5}
                value={form.bio}
                onChange={(e) => update('bio', e.target.value)}
                placeholder="I build performant Next.js apps for B2B SaaS. Last 3 years I've focused on dashboard UIs and Stripe integrations..."
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <FieldLabel>Years exp.</FieldLabel>
                <Input
                  type="number" min="0" max="60"
                  value={form.years_experience}
                  onChange={(e) => update('years_experience', e.target.value)}
                  placeholder="5"
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Rate min ($/h)</FieldLabel>
                <Input
                  type="number" min="0"
                  value={form.hourly_rate_min}
                  onChange={(e) => update('hourly_rate_min', e.target.value)}
                  placeholder="80"
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Rate max ($/h)</FieldLabel>
                <Input
                  type="number" min="0"
                  value={form.hourly_rate_max}
                  onChange={(e) => update('hourly_rate_max', e.target.value)}
                  placeholder="120"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Tech stack */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-950">
          <CardHeader icon={Code2} title="Tech stack" description="Required. Pick what you actually ship." iconColor="text-violet-400" />
          <div className="px-5 py-4">
            <ChipPicker
              options={TECH_SUGGESTIONS}
              selected={form.tech_stack}
              onToggle={(v) => toggleArray('tech_stack', v)}
              allowCustom
            />
          </div>
        </section>

        {/* Industries */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-950">
          <CardHeader icon={Building} title="Industries" description="Domains you have experience in." />
          <div className="px-5 py-4">
            <ChipPicker
              options={INDUSTRY_SUGGESTIONS}
              selected={form.industries}
              onToggle={(v) => toggleArray('industries', v)}
              allowCustom
            />
          </div>
        </section>

        {/* Engagement */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-950">
          <CardHeader icon={Briefcase} title="Preferred engagement" description="What kind of work you're open to." />
          <div className="px-5 py-4">
            <ChipPicker
              options={ENGAGEMENT_OPTIONS}
              selected={form.preferred_engagement}
              onToggle={(v) => toggleArray('preferred_engagement', v)}
            />
          </div>
        </section>

        {/* Links */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-950">
          <CardHeader icon={Link2} title="Links" description="AI references these in pitches. All optional." />
          <div className="px-5 py-4 space-y-4">
            <div className="space-y-1.5">
              <FieldLabel>Portfolio</FieldLabel>
              <Input type="url" value={form.portfolio_url} onChange={(e) => update('portfolio_url', e.target.value)} placeholder="https://yourname.com" />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>LinkedIn</FieldLabel>
              <Input type="url" value={form.linkedin_url} onChange={(e) => update('linkedin_url', e.target.value)} placeholder="https://linkedin.com/in/you" />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>GitHub</FieldLabel>
              <Input type="url" value={form.github_url} onChange={(e) => update('github_url', e.target.value)} placeholder="https://github.com/you" />
            </div>
          </div>
        </section>

        {submitError && (
          <div className="rounded-lg bg-red-950/50 border border-red-900/50 p-3 text-sm text-red-400">
            {submitError}
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-base font-semibold"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating profile…
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Save &amp; find leads
            </>
          )}
        </Button>
      </main>
    </div>
  )
}
