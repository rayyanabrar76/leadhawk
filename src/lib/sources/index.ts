import type { Lead } from './types'
import { fetchHackerNewsLeads } from './hackernews'
import { fetchRemotiveLeads } from './remotive'
import { fetchRemoteOKLeads } from './remoteok'
import { fetchArbeitnowLeads } from './arbeitnow'
import { fetchGitHubBountyLeads } from './github-bounties'

const SOURCE_NAMES = ['hn', 'remotive', 'remoteok', 'arbeitnow', 'github'] as const
const MAX_AGE_HOURS = 7 * 24

export interface SourceFunnel {
  source: (typeof SOURCE_NAMES)[number]
  count: number
  error?: string
}

export interface FetchAllResult {
  leads: Lead[]
  funnel: SourceFunnel[]
}

export async function fetchAllSources(keywords: string[]): Promise<FetchAllResult> {
  const results = await Promise.allSettled([
    fetchHackerNewsLeads(keywords),
    fetchRemotiveLeads(keywords),
    fetchRemoteOKLeads(keywords),
    fetchArbeitnowLeads(keywords),
    fetchGitHubBountyLeads(keywords),
  ])

  const funnel: SourceFunnel[] = []
  const leads: Lead[] = []

  results.forEach((r, i) => {
    const name = SOURCE_NAMES[i]
    if (r.status === 'fulfilled') {
      const list = r.value
      funnel.push({ source: name, count: list.length })
      leads.push(...list)
      console.log(`[sources] ${name}: ${list.length} candidates`)
      if (list.length === 0) {
        console.log(
          `[sources] ${name}: ZERO RESULT — possible reasons: keyword filter too strict, API returned empty, or response shape changed`
        )
      }
    } else {
      const msg = r.reason instanceof Error ? r.reason.message : String(r.reason)
      funnel.push({ source: name, count: 0, error: msg })
      console.error(`[sources] ${name}: REJECTED`)
      console.error(r.reason)
      if (r.reason instanceof Error && r.reason.stack) {
        console.error(r.reason.stack)
      }
    }
  })

  // Hard freshness gate — premise of the product is < 24h leads. Any source
  // that ignores its own date filter gets cut here as a safety net.
  const cutoff = Date.now() - MAX_AGE_HOURS * 3_600_000
  const fresh = leads.filter((l) => l.posted_at.getTime() >= cutoff)
  console.log(
    `[freshness] ${leads.length} → ${fresh.length} after ${MAX_AGE_HOURS}h (${MAX_AGE_HOURS / 24}d) filter`
  )

  return { leads: fresh, funnel }
}
