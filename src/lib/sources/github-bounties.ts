import { INTENT_PRIORITY, type Lead } from './types'
import { anyKeywordMatch, freshnessScore } from './utils'
import { getCached, setCached } from '@/lib/cache/source-cache'

// GitHub bounty issues — public GitHub Search API.
// Unauthenticated allows 10 req/min; with GITHUB_TOKEN we get 30/min.
// Single search across all open bounty-labeled issues, cached 30 min.

const CACHE_TTL_SECONDS = 30 * 60
const ITEM_CAP = 30
const MAX_AGE_MS = 30 * 24 * 3_600_000

interface GitHubIssue {
  id: number
  title: string
  body?: string | null
  html_url: string
  user?: { login?: string }
  created_at: string
  repository_url?: string
  labels?: Array<{ name: string }>
}

interface GitHubSearchResponse {
  items?: GitHubIssue[]
}

async function fetchBountiesRaw(): Promise<GitHubIssue[]> {
  const cached = await getCached<GitHubIssue[]>('github_bounties', '*', CACHE_TTL_SECONDS)
  if (cached) {
    console.log(`[github] cache HIT, ${cached.length} issues`)
    return cached
  }
  console.log(`[github] cache MISS, fetching API`)

  const tokenPresent = Boolean(process.env.GITHUB_TOKEN)
  console.log(`[github] Token present: ${tokenPresent}`)

  const headers: Record<string, string> = {
    'User-Agent': 'LeadHawk/1.0',
    Accept: 'application/vnd.github+json',
  }
  if (tokenPresent) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  }

  const url =
    'https://api.github.com/search/issues?q=label:bounty+state:open&sort=created&order=desc&per_page=50'
  console.log(`[github] Fetching: ${url}`)
  const res = await fetch(url, { headers })
  console.log(`[github] HTTP ${res.status}`)
  if (!res.ok) {
    const bodyText = await res.text().catch(() => '<unreadable>')
    console.error(`[github] non-OK body sample:`, bodyText.slice(0, 300))
    throw new Error(`GitHub ${res.status}`)
  }
  const data = (await res.json()) as GitHubSearchResponse
  const items = data.items ?? []
  console.log(`[github] Raw issues from API: ${items.length}`)

  await setCached('github_bounties', '*', items)
  return items
}

function repoFromUrl(url: string | undefined): string | null {
  if (!url) return null
  // https://api.github.com/repos/owner/repo → owner/repo
  const m = url.match(/\/repos\/([^/]+\/[^/]+)$/)
  return m ? m[1] : null
}

export async function fetchGitHubBountyLeads(keywords: string[]): Promise<Lead[]> {
  const issues = await fetchBountiesRaw()
  console.log(`[github] Filtering ${issues.length} issues against keywords: [${keywords.join(', ')}]`)
  const cutoff = Date.now() - MAX_AGE_MS

  let dateDropped = 0
  const matched: Lead[] = []
  for (const i of issues) {
    if (!i.id || !i.title) continue

    const postedAt = new Date(i.created_at)
    if (!Number.isFinite(postedAt.getTime()) || postedAt.getTime() < cutoff) {
      dateDropped++
      continue
    }

    const haystack = `${i.title}\n${i.body ?? ''}`
    if (keywords.length > 0 && !anyKeywordMatch(haystack, keywords)) continue

    const repo = repoFromUrl(i.repository_url)
    const author = i.user?.login ?? 'unknown'

    matched.push({
      source: 'github_bounties',
      source_id: String(i.id),
      title: i.title,
      body: (i.body ?? '').slice(0, 4000),
      url: i.html_url,
      author,
      posted_at: postedAt,
      freshness_score: freshnessScore(postedAt),
      intent_priority: INTENT_PRIORITY.github_bounty,
      bucket: 'github_bounty',
      authorEmail: null,
      company_name: repo,
      company_logo: null,
      salary: null,
      apply_url: null,
      tags: (i.labels ?? []).map((l) => l.name).filter(Boolean),
    })

    if (matched.length >= ITEM_CAP) break
  }

  console.log(`[github] After keyword filter: ${matched.length} (dropped by date: ${dateDropped})`)
  return matched
}
