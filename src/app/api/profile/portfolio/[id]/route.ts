import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { refreshProfileSummary } from '@/lib/profile/refresh-summary'

interface PortfolioPatch {
  title?: string
  url?: string | null
  description?: string | null
  tech_used?: string[] | null
  outcome?: string | null
}

const ALLOWED_KEYS: Array<keyof PortfolioPatch> = [
  'title',
  'url',
  'description',
  'tech_used',
  'outcome',
]

interface RouteCtx {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, { params }: RouteCtx) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = (await request.json().catch(() => ({}))) as PortfolioPatch

  const updates: Record<string, unknown> = {}
  for (const k of ALLOWED_KEYS) {
    if (k in body) updates[k] = body[k]
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const { error } = await supabase
    .from('portfolio_items')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await refreshProfileSummary(user.id)
  return NextResponse.json({ ok: true })
}

export async function DELETE(_request: Request, { params }: RouteCtx) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { error } = await supabase
    .from('portfolio_items')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await refreshProfileSummary(user.id)
  return NextResponse.json({ ok: true })
}
