import { INTENT_PRIORITY, type Lead } from './types'
import { anyKeywordMatch, freshnessScore, stripHtml } from './utils'
import { getCached, setCached } from '@/lib/cache/source-cache'

// RemoteOK — https://remoteok.com/api
// Returns ALL current jobs in one shot (no search param). First element is a
// metadata/legal notice — skip it. We cache the entire response for 6h, then
// keyword-filter client-side per call.

const CACHE_TTL_SECONDS = 6 * 60 * 60
const ITEM_CAP = 50
const MAX_AGE_MS = 24 * 3_600_000

interface RemoteOKJob {
  id?: string | number
  slug?: string
  company?: string
  position?: string
  tags?: string[]
  description?: string
  date?: string
  url?: string
  apply_url?: string
  location?: string
  salary_min?: number
  salary_max?: number
  logo?: string
  // First entry is a legal-notice object lacking these fields
  legal?: string
}

async function fetchRemoteOKRaw(): Promise<RemoteOKJob[]> {
  const cached = await getCached<RemoteOKJob[]>('remoteok', '*', CACHE_TTL_SECONDS)
  if (cached) {
    console.log(`[remoteok] cache HIT, ${cached.length} jobs`)
    return cached
  }
  console.log(`[remoteok] cache MISS, fetching API`)

  const userAgent = 'LeadHawk/1.0'
  console.log(`[remoteok] User-Agent header: "${userAgent}"`)
  const res = await fetch('https://remoteok.com/api', {
    headers: { 'User-Agent': userAgent, Accept: 'application/json' },
  })
  console.log(`[remoteok] HTTP ${res.status} from https://remoteok.com/api`)
  if (!res.ok) {
    const bodyText = await res.text().catch(() => '<unreadable>')
    console.error(`[remoteok] non-OK body sample:`, bodyText.slice(0, 300))
    throw new Error(`RemoteOK ${res.status}`)
  }
  const data = (await res.json()) as RemoteOKJob[]
  console.log(`[remoteok] Raw count from API: ${Array.isArray(data) ? data.length : 'unknown shape'}`)
  // First element is a metadata/legal notice — drop entries without an id
  const jobs = (Array.isArray(data) ? data : []).filter((j) => Boolean(j?.id))
  console.log(`[remoteok] After dropping legal-notice entries: ${jobs.length}`)

  await setCached('remoteok', '*', jobs)
  return jobs
}

function formatSalary(min?: number, max?: number): string | null {
  if (!min && !max) return null
  if (min && max) return `$${Math.round(min / 1000)}k–$${Math.round(max / 1000)}k`
  const v = (min ?? max)!
  return `$${Math.round(v / 1000)}k`
}

export async function fetchRemoteOKLeads(keywords: string[]): Promise<Lead[]> {
  const jobs = await fetchRemoteOKRaw()
  console.log(`[remoteok] Filtering ${jobs.length} jobs against keywords: [${keywords.join(', ')}]`)
  const cutoff = Date.now() - MAX_AGE_MS

  let dateDropped = 0
  const matched: Lead[] = []
  for (const j of jobs) {
    if (!j.id || !j.position) continue

    const postedAt = j.date ? new Date(j.date) : new Date()
    if (!Number.isFinite(postedAt.getTime()) || postedAt.getTime() < cutoff) {
      dateDropped++
      continue
    }

    const haystack = [
      j.position,
      j.company ?? '',
      j.description ?? '',
      ...(j.tags ?? []),
    ].join(' ')
    if (keywords.length > 0 && !anyKeywordMatch(haystack, keywords)) continue

    const url = j.url ?? `https://remoteok.com/remote-jobs/${j.slug ?? j.id}`

    matched.push({
      source: 'remoteok',
      source_id: String(j.id),
      title: j.position,
      body: stripHtml(j.description ?? '').slice(0, 4000),
      url,
      author: j.company ?? 'Unknown',
      posted_at: postedAt,
      freshness_score: freshnessScore(postedAt),
      intent_priority: INTENT_PRIORITY.job_board,
      bucket: 'job_board',
      authorEmail: null,
      company_name: j.company ?? null,
      company_logo: j.logo ?? null,
      salary: formatSalary(j.salary_min, j.salary_max),
      apply_url: j.apply_url ?? url,
      tags: j.tags ?? null,
    })

    if (matched.length >= ITEM_CAP) break
  }

  console.log(`[remoteok] After keyword filter: ${matched.length} (dropped by date: ${dateDropped})`)
  return matched
}
