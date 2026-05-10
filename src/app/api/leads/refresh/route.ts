import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { fetchHackerNewsLeads } from '@/lib/sources/hackernews'
import { generateKeywordVariations } from '@/lib/ai/draft-pitch'
import { classifyManyWithConcurrency } from '@/lib/ai/classify-intent'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('skill')
    .eq('id', user.id)
    .single()

  if (!profile?.skill) {
    return NextResponse.json({ error: 'No skill set' }, { status: 400 })
  }

  const keywords = await generateKeywordVariations(profile.skill)
  const candidates = await fetchHackerNewsLeads(keywords)
  const candidateCount = candidates.length

  const { kept, dropped } = await classifyManyWithConcurrency(candidates, 5)

  console.log(
    `[refresh] Filtered ${candidateCount} candidates → ${kept.length} real leads (dropped ${dropped})`
  )

  const service = createServiceClient()

  // Backfill: classify any existing leads where intent_priority IS NULL.
  // Source bucket is unknown for these, so set priority based on classify result:
  // YES → 50 (mid-tier default), NO → 0 (still inserted but ranked low).
  const { data: nullPriorityLeads } = await service
    .from('leads')
    .select('id, source_id, title, body')
    .eq('user_id', user.id)
    .is('intent_priority', null)
    .limit(100)

  let backfilled = 0
  if (nullPriorityLeads && nullPriorityLeads.length > 0) {
    const { kept: ok, dropped: rej } = await classifyManyWithConcurrency(
      nullPriorityLeads.map((l) => ({
        source_id: l.source_id,
        title: l.title,
        body: l.body ?? '',
        _id: l.id,
      })) as ({ source_id: string; title: string; body: string; _id: string })[],
      5
    )

    const updates: PromiseLike<unknown>[] = []
    for (const lead of ok) {
      updates.push(
        service.from('leads').update({ intent_priority: 50 }).eq('id', (lead as { _id: string })._id)
      )
    }
    // Mark rejects with priority 0 so they sink to the bottom (still visible if user toggles filter off)
    const rejectIds = nullPriorityLeads
      .filter((l) => !ok.find((k) => (k as { _id: string })._id === l.id))
      .map((l) => l.id)
    if (rejectIds.length > 0) {
      updates.push(
        service.from('leads').update({ intent_priority: 0 }).in('id', rejectIds)
      )
    }
    await Promise.all(updates.map((u) => Promise.resolve(u)))
    backfilled = nullPriorityLeads.length
    console.log(`[refresh] Backfilled ${backfilled} existing leads (${ok.length} kept, ${rej} dropped)`)
  }

  if (kept.length === 0) {
    return NextResponse.json({
      inserted: 0,
      candidates: candidateCount,
      dropped,
      backfilled,
      keywords,
      message: 'No leads passed the intent filter',
    })
  }

  const rows = kept.map((lead) => ({
    user_id: user.id,
    source: lead.source,
    source_id: lead.source_id,
    title: lead.title,
    body: lead.body ?? '',
    url: lead.url,
    author: lead.author,
    posted_at: lead.posted_at.toISOString(),
    freshness_score: lead.freshness_score,
    intent_priority: lead.intent_priority,
    status: lead.authorEmail ? ('new' as const) : ('no_email' as const),
  }))

  const { error } = await service
    .from('leads')
    .upsert(rows, { onConflict: 'user_id,source,source_id', ignoreDuplicates: true })

  if (error) {
    console.error('Lead upsert error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Top 3 by final_score for sanity check (logged server-side)
  const top3 = [...kept]
    .map((l) => ({
      title: l.title.slice(0, 100),
      bucket: l.bucket,
      score: Math.round(l.freshness_score * 0.4 + l.intent_priority * 0.6),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)

  console.log('[refresh] Top 3 by final_score:', top3)

  return NextResponse.json({
    inserted: rows.length,
    candidates: candidateCount,
    dropped,
    backfilled,
    keywords,
    top3,
  })
}
