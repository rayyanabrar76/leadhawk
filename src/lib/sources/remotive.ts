import { INTENT_PRIORITY, type Lead } from './types'
import { freshnessScore, stripHtml } from './utils'
import { getCached, setCached } from '@/lib/cache/source-cache'

// Remotive — https://remotive.com/api/remote-jobs?search={keyword}
// Hard limit: 4 requests/day total across all users. We use ONE keyword
// (the primary skill) and cache for 12 hours to stay well under the cap.

const CACHE_TTL_SECONDS = 12 * 60 * 60
const ITEM_CAP = 30
const MAX_AGE_MS = 24 * 3_600_000

interface RemotiveJob {
  id: number
  url: string
  title: string
  company_name: string
  company_logo?: string
  category?: string
  job_type?: string
  publication_date: string
  candidate_required_location?: string
  salary?: string
  description: string
}

interface RemotiveResponse {
  jobs?: RemotiveJob[]
}

async function fetchRemotiveRaw(keyword: string): Promise<RemotiveJob[]> {
  const cacheKey = keyword.toLowerCase().slice(0, 64)
  const cached = await getCached<RemotiveJob[]>('remotive', cacheKey, CACHE_TTL_SECONDS)
  if (cached) {
    console.log(`[remotive] cache HIT for "${cacheKey}", ${cached.length} jobs`)
    return cached
  }
  console.log(`[remotive] cache MISS for "${cacheKey}", fetching API`)

  const url = `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(keyword)}`
  console.log(`[remotive] Fetching: ${url}`)
  const res = await fetch(url, {
    headers: { 'User-Agent': 'LeadHawk/1.0' },
  })
  console.log(`[remotive] HTTP ${res.status}`)
  if (!res.ok) {
    const bodyText = await res.text().catch(() => '<unreadable>')
    console.error(`[remotive] non-OK body sample:`, bodyText.slice(0, 300))
    throw new Error(`Remotive ${res.status}`)
  }
  const data = (await res.json()) as RemotiveResponse
  const jobs = data.jobs ?? []
  console.log(`[remotive] Raw jobs from API: ${jobs.length}`)

  await setCached('remotive', cacheKey, jobs)
  return jobs
}

export async function fetchRemotiveLeads(keywords: string[]): Promise<Lead[]> {
  const primary = keywords[0]
  if (!primary) {
    console.log(`[remotive] No primary keyword — skipping`)
    return []
  }
  console.log(`[remotive] Primary keyword: "${primary}"`)

  const allJobs = await fetchRemotiveRaw(primary)
  const cutoff = Date.now() - MAX_AGE_MS
  const jobs = allJobs.filter((j) => {
    const t = new Date(j.publication_date).getTime()
    return Number.isFinite(t) && t >= cutoff
  })
  console.log(`[remotive] ${allJobs.length} → ${jobs.length} after 24h date filter`)

  return jobs.slice(0, ITEM_CAP).map((j): Lead => {
    const postedAt = new Date(j.publication_date)
    return {
      source: 'remotive',
      source_id: String(j.id),
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
      company_logo: j.company_logo ?? null,
      salary: j.salary ?? null,
      apply_url: j.url,
      tags: [j.category, j.job_type].filter((t): t is string => Boolean(t)),
    }
  })
}
