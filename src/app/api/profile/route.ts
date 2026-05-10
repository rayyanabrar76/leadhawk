import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { refreshProfileSummary } from '@/lib/profile/refresh-summary'

interface ProfilePatch {
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
  skill?: string | null
  // Caller can opt out of summary regen for trivial edits like a link change
  skip_summary?: boolean
}

const ALLOWED_KEYS: Array<keyof ProfilePatch> = [
  'bio',
  'years_experience',
  'hourly_rate_min',
  'hourly_rate_max',
  'preferred_engagement',
  'industries',
  'tech_stack',
  'portfolio_url',
  'linkedin_url',
  'github_url',
  'skill',
]

function pickAllowed(body: ProfilePatch): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const key of ALLOWED_KEYS) {
    if (key in body) out[key] = body[key]
  }
  return out
}

export async function PUT(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as ProfilePatch
  const updates = pickAllowed(body)

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const { error } = await supabase
    .from('profiles')
    .upsert({ id: user.id, email: user.email, ...updates })

  if (error) {
    console.error('[profile PUT] update failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Regenerate AI summary unless caller opted out (e.g. just a link edit)
  if (!body.skip_summary) {
    await refreshProfileSummary(user.id)
  }

  return NextResponse.json({ ok: true })
}
