import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { refreshProfileSummary } from '@/lib/profile/refresh-summary'

interface PortfolioBody {
  title: string
  url?: string | null
  description?: string | null
  tech_used?: string[] | null
  outcome?: string | null
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as PortfolioBody | null
  if (!body || !body.title?.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('portfolio_items')
    .insert({
      user_id: user.id,
      title: body.title.trim(),
      url: body.url ?? null,
      description: body.description ?? null,
      tech_used: body.tech_used ?? null,
      outcome: body.outcome ?? null,
    })
    .select()
    .single()

  if (error) {
    console.error('[portfolio POST] insert failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await refreshProfileSummary(user.id)

  return NextResponse.json({ item: data })
}
