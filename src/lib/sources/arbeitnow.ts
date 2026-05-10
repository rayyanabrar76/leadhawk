import { INTENT_PRIORITY, type Lead } from './types'
import { anyKeywordMatch, freshnessScore, stripHtml } from './utils'
import { getCached, setCached } from '@/lib/cache/source-cache'

// Arbeitnow — https://www.arbeitnow.com/api/job-board-api
// Paginated, no auth, no search. Pull pages 1-2 and keyword-filter client-side.
// Cache the combined raw response for 6h.

const CACHE_TTL_SECONDS = 6 * 60 * 60
const ITEM_CAP = 50
const PAGES = 2
const MAX_AGE_MS = 24 * 3_600_000

interface ArbeitnowJob {
  slug: string
  company_name: string
  title: string
  description: string
  remote?: boolean
  url: string
  tags?: string[]
  job_types?: string[]
  location?: string
  created_at?: number | string
}

interface ArbeitnowResponse {
  data?: ArbeitnowJob[]
}

async function fetchArbeitnowRaw(): Promise<ArbeitnowJob[]> {
  const cached = await getCached<ArbeitnowJob[]>('arbeitnow', '*', CACHE_TTL_SECONDS)
  if (cached) {
    console.log(`[arbeitnow] cache HIT, ${cached.length} jobs`)
    return cached
  }
  console.log(`[arbeitnow] cache MISS, fetching API`)

  const all: ArbeitnowJob[] = []
  for (let page = 1; page <= PAGES; page++) {
    const url = `https://www.arbeitnow.com/api/job-board-api?page=${page}`
    console.log(`[arbeitnow] Fetching page ${page}: ${url}`)
    const res = await fetch(url, {
      headers: { 'User-Agent': 'LeadHawk/1.0' },
    })
    console.log(`[arbeitnow] page ${page} HTTP ${res.status}`)
    if (!res.ok) {
      const bodyText = await res.text().catch(() => '<unreadable>')
      console.error(`[arbeitnow] page ${page} non-OK body sample:`, bodyText.slice(0, 300))
      if (page === 1) throw new Error(`Arbeitnow ${res.status}`)
      break
    }
    const data = (await res.json()) as ArbeitnowResponse
    const jobs = data.data ?? []
    console.log(`[arbeitnow] page ${page} jobs: ${jobs.length}`)
    all.push(...jobs)
    if (jobs.length === 0) break
  }

  console.log(`[arbeitnow] Raw count from API (combined pages): ${all.length}`)
  await setCached('arbeitnow', '*', all)
  return all
}

function toDate(created: number | string | undefined): Date {
  if (!created) return new Date()
  if (typeof created === 'number') return new Date(created * 1000)
  return new Date(created)
}

export async function fetchArbeitnowLeads(keywords: string[]): Promise<Lead[]> {
  const jobs = await fetchArbeitnowRaw()
  console.log(`[arbeitnow] Filtering ${jobs.length} jobs against keywords: [${keywords.join(', ')}]`)
  const cutoff = Date.now() - MAX_AGE_MS

  let dateDropped = 0
  const matched: Lead[] = []
  for (const j of jobs) {
    if (!j.slug || !j.title) continue

    const postedAt = toDate(j.created_at)
    if (!Number.isFinite(postedAt.getTime()) || postedAt.getTime() < cutoff) {
      dateDropped++
      continue
    }

    const haystack = [
      j.title,
      j.company_name ?? '',
      j.description ?? '',
      ...(j.tags ?? []),
      ...(j.job_types ?? []),
    ].join(' ')
    if (keywords.length > 0 && !anyKeywordMatch(haystack, keywords)) continue

    matched.push({
      source: 'arbeitnow',
      source_id: j.slug,
      title: j.title,
      body: stripHtml(j.description ?? '').slice(0, 4000),
      url: j.url,
      author: j.company_name,
      posted_at: postedAt,
      freshness_score: freshnessScore(postedAt),
      intent_priority: INTENT_PRIORITY.job_board,
      bucket: 'job_board',
      authorEmail: null,
      company_name: j.company_name,
      company_logo: null,
      salary: null,
      apply_url: j.url,
      tags: [...(j.tags ?? []), ...(j.job_types ?? [])],
    })

    if (matched.length >= ITEM_CAP) break
  }

  console.log(`[arbeitnow] After keyword filter: ${matched.length} (dropped by date: ${dateDropped})`)
  return matched
}
