import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { fetchAllSources } from '@/lib/sources'
import { generateKeywordVariations } from '@/lib/ai/draft-pitch'
import { classifyManyWithConcurrency } from '@/lib/ai/classify-intent'
import { calculateFitScore } from '@/lib/scoring/fit-score'

const INSERT_CAP = 50
const MIN_FIT_SCORE = 25

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('skill, bio, tech_stack, industries')
    .eq('id', user.id)
    .single()

  if (!profile?.skill) {
    return NextResponse.json({ error: 'No skill set' }, { status: 400 })
  }

  const keywords = generateKeywordVariations({
    skill: profile.skill,
    bio: profile.bio,
    techStack: profile.tech_stack,
    industries: profile.industries,
  })
  console.log(`[refresh] Skill: "${profile.skill}"`)
  console.log(`[refresh] Tech stack: ${JSON.stringify(profile.tech_stack)}`)
  console.log(`[refresh] Expanded keywords: ${JSON.stringify(keywords)}`)

  const { leads: rawLeads, funnel } = await fetchAllSources(keywords)
  const rawTotal = rawLeads.length

  // Dedupe across sources by (source, source_id) — different sources can collide
  // on the same numeric id otherwise.
  const dedupedMap = new Map<string, (typeof rawLeads)[number]>()
  for (const l of rawLeads) {
    dedupedMap.set(`${l.source}:${l.source_id}`, l)
  }
  const candidates = Array.from(dedupedMap.values())
  const dedupedTotal = candidates.length

  // Filter against existing leads in DB so we never re-classify what's already stored
  const service = createServiceClient()
  const sourceIdsBySource = candidates.reduce<Record<string, string[]>>((acc, c) => {
    ;(acc[c.source] ??= []).push(c.source_id)
    return acc
  }, {})

  const existingKeys = new Set<string>()
  for (const [src, ids] of Object.entries(sourceIdsBySource)) {
    if (ids.length === 0) continue
    const { data: existing } = await service
      .from('leads')
      .select('source, source_id')
      .eq('user_id', user.id)
      .eq('source', src)
      .in('source_id', ids)
    for (const row of existing ?? []) {
      existingKeys.add(`${row.source}:${row.source_id}`)
    }
  }
  const newCandidates = candidates.filter(
    (c) => !existingKeys.has(`${c.source}:${c.source_id}`)
  )

  // High-priority buckets (job_board=85, github_bounty=80, whoishiring=100,
  // freelancer=90) skip Gemini classification — saves quota and avoids
  // fail-open garbage from generic HN searches.
  const trustedKept = newCandidates.filter((c) => c.intent_priority >= 80)
  const needsClassification = newCandidates.filter((c) => c.intent_priority < 80)

  const { kept: classifiedKept, dropped } = await classifyManyWithConcurrency(
    needsClassification,
    5
  )

  const kept = [...trustedKept, ...classifiedKept]

  // Fit scoring uses individual tech terms (e.g. "React", "TypeScript") in
  // addition to compound search phrases. Job descriptions don't say "React developer"
  // verbatim — they say "React" — so single-token terms are needed for matching.
  const fitKeywords = Array.from(new Set([
    ...keywords,
    ...((profile.tech_stack ?? []) as string[]).map((t) => t.toLowerCase()),
    profile.skill.toLowerCase(),
  ]))

  for (const lead of kept) {
    lead.fit_score = calculateFitScore(fitKeywords, {
      title: lead.title,
      body: lead.body,
      tags: lead.tags ?? null,
      company_name: lead.company_name ?? null,
    })
  }

  // Drop irrelevant matches — fit=0 leads should never reach the dashboard
  const beforeFit = kept.length
  const qualified = kept.filter((l) => (l.fit_score ?? 0) >= MIN_FIT_SCORE)
  console.log(`[fit] ${beforeFit} → ${qualified.length} after MIN_FIT_SCORE=${MIN_FIT_SCORE}`)

  console.log(
    `[refresh] Funnel: ${rawTotal} raw → ${dedupedTotal} deduped → ${newCandidates.length} new → ${kept.length} passed intent → ${qualified.length} passed fit (dropped ${dropped})`
  )
  for (const f of funnel) {
    console.log(
      `[refresh]   ${f.source}: ${f.count}${f.error ? ` (error: ${f.error})` : ''}`
    )
  }

  // Backfill existing null intent_priority leads (HN-only legacy rows)
  const { data: nullPriorityLeads } = await service
    .from('leads')
    .select('id, source_id, title, body')
    .eq('user_id', user.id)
    .is('intent_priority', null)
    .limit(100)

  let backfilled = 0
  if (nullPriorityLeads && nullPriorityLeads.length > 0) {
    const { kept: ok } = await classifyManyWithConcurrency(
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
  }

  if (qualified.length === 0) {
    return NextResponse.json({
      inserted: 0,
      candidates: rawTotal,
      deduped: dedupedTotal,
      dropped,
      backfilled,
      keywords,
      funnel,
      message:
        kept.length === 0
          ? 'No leads passed the intent filter'
          : `No leads passed the fit threshold (MIN_FIT_SCORE=${MIN_FIT_SCORE})`,
    })
  }

  // Layered ranking: 0.4 freshness + 0.4 intent + 0.2 fit
  // Sort then cap inserts so the user sees the best ones first.
  const ranked = [...qualified]
    .map((l) => ({
      lead: l,
      score:
        0.4 * l.freshness_score +
        0.4 * l.intent_priority +
        0.2 * (l.fit_score ?? 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, INSERT_CAP)
    .map((r) => r.lead)

  const rows = ranked.map((lead) => ({
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
    fit_score: lead.fit_score ?? 0,
    company_name: lead.company_name ?? null,
    company_logo: lead.company_logo ?? null,
    salary: lead.salary ?? null,
    apply_url: lead.apply_url ?? null,
    tags: lead.tags ?? null,
    status: lead.authorEmail ? ('new' as const) : ('no_email' as const),
  }))

  const { error } = await service
    .from('leads')
    .upsert(rows, { onConflict: 'user_id,source,source_id', ignoreDuplicates: true })

  if (error) {
    console.error('Lead upsert error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const top3 = ranked.slice(0, 3).map((l) => ({
    title: l.title.slice(0, 100),
    source: l.source,
    bucket: l.bucket,
    intent: l.intent_priority,
    fit: l.fit_score ?? 0,
  }))

  console.log('[refresh] Top 3 ranked:', top3)

  return NextResponse.json({
    inserted: rows.length,
    candidates: rawTotal,
    deduped: dedupedTotal,
    dropped,
    backfilled,
    keywords,
    funnel,
    top3,
  })
}
