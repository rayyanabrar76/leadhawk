import { INTENT_PRIORITY, type Lead, type SourceBucket } from './types'

const ITEM_CAP = 50

const HIRING_TITLE_RE = /\b(hire|hiring|looking for|need|seeking|recommend)\b/i

function freshnessScore(postedAt: Date): number {
  const hoursOld = (Date.now() - postedAt.getTime()) / 3_600_000
  return Math.max(0, Math.round(100 - hoursOld * 4))
}

function hnItemUrl(id: string | number): string {
  return `https://news.ycombinator.com/item?id=${id}`
}

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#39;/g, "'")
    .replace(/<p>/g, '\n\n')
    .replace(/<[^>]+>/g, '')
}

export function extractEmail(text: string): string | null {
  if (!text) return null

  const decoded = decodeHtml(text)

  const plain = decoded.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/)
  if (plain) return plain[0].toLowerCase()

  const obfuscated = decoded.match(
    /([a-zA-Z0-9._%+\-]+)\s*[\[\(\{]\s*at\s*[\]\)\}]\s*([a-zA-Z0-9\-]+)\s*([\[\(\{]\s*dot\s*[\]\)\}]\s*[a-zA-Z]+)+/i
  )
  if (obfuscated) {
    const reconstructed = obfuscated[0]
      .replace(/\s*[\[\(\{]\s*at\s*[\]\)\}]\s*/i, '@')
      .replace(/\s*[\[\(\{]\s*dot\s*[\]\)\}]\s*/gi, '.')
      .replace(/\s+/g, '')
    if (/^[^@]+@[^@]+\.[a-zA-Z]{2,}$/.test(reconstructed)) {
      return reconstructed.toLowerCase()
    }
  }

  const spaced = decoded.match(
    /([a-zA-Z0-9._%+\-]+)\s+at\s+([a-zA-Z0-9\-]+)(\s+dot\s+[a-zA-Z]+)+/i
  )
  if (spaced) {
    const reconstructed = spaced[0]
      .replace(/\s+at\s+/i, '@')
      .replace(/\s+dot\s+/gi, '.')
      .replace(/\s+/g, '')
    if (/^[^@]+@[^@]+\.[a-zA-Z]{2,}$/.test(reconstructed)) {
      return reconstructed.toLowerCase()
    }
  }

  return null
}

export async function getHNUserEmail(username: string): Promise<string | null> {
  if (!username) return null
  try {
    const res = await fetch(
      `https://hacker-news.firebaseio.com/v0/user/${encodeURIComponent(username)}.json`
    )
    if (!res.ok) return null
    const user = await res.json()
    return extractEmail(user?.about ?? '')
  } catch {
    return null
  }
}

interface AlgoliaHit {
  objectID: string
  title?: string | null
  story_text?: string | null
  comment_text?: string | null
  url?: string | null
  author: string
  created_at: string
  _tags?: string[]
}

async function searchAlgolia(
  tags: string,
  query: string,
  cutoffUnix: number
): Promise<AlgoliaHit[]> {
  const url = `https://hn.algolia.com/api/v1/search_by_date?tags=${tags}&query=${encodeURIComponent(
    query
  )}&numericFilters=created_at_i>${cutoffUnix}&hitsPerPage=20`

  try {
    const res = await fetch(url)
    if (!res.ok) return []
    const data = await res.json()
    return (data?.hits ?? []) as AlgoliaHit[]
  } catch {
    return []
  }
}

function hitToLead(
  hit: AlgoliaHit,
  isComment: boolean,
  bucket: SourceBucket
): Lead {
  const postedAt = new Date(hit.created_at)
  const body = decodeHtml(
    isComment ? hit.comment_text ?? '' : hit.story_text ?? ''
  ).trim()

  const title = hit.title?.trim()
    ? hit.title
    : isComment
    ? body.slice(0, 100) + (body.length > 100 ? '…' : '')
    : 'Untitled'

  return {
    source: 'hackernews',
    source_id: hit.objectID,
    title,
    body,
    url: hnItemUrl(hit.objectID),
    author: hit.author ?? 'unknown',
    posted_at: postedAt,
    freshness_score: freshnessScore(postedAt),
    intent_priority: INTENT_PRIORITY[bucket],
    bucket,
  }
}

interface HNFirebaseItem {
  id: number
  by?: string
  text?: string
  time?: number
  kids?: number[]
  title?: string
  type?: string
  deleted?: boolean
  dead?: boolean
}

async function fetchHNItem(id: number): Promise<HNFirebaseItem | null> {
  try {
    const res = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
    if (!res.ok) return null
    return (await res.json()) as HNFirebaseItem
  } catch {
    return null
  }
}

async function findLatestThreadByUser(
  user: string,
  titlePrefix: string
): Promise<number | null> {
  try {
    const res = await fetch(
      `https://hn.algolia.com/api/v1/search_by_date?tags=story,author_${user}&hitsPerPage=10`
    )
    if (!res.ok) return null
    const data = await res.json()
    const hits = (data?.hits ?? []) as AlgoliaHit[]
    const match = hits.find((h) =>
      (h.title ?? '').toLowerCase().startsWith(titlePrefix.toLowerCase())
    )
    return match ? Number(match.objectID) : null
  } catch {
    return null
  }
}

async function fetchTopLevelComments(
  threadId: number,
  cutoffMs: number,
  filter: (text: string) => boolean,
  keywords: string[],
  bucket: SourceBucket
): Promise<Lead[]> {
  const thread = await fetchHNItem(threadId)
  if (!thread?.kids) return []

  const ids = thread.kids.slice(0, 200)
  const items = await Promise.all(ids.map((id) => fetchHNItem(id)))

  const leads: Lead[] = []
  const lowerKeywords = keywords.map((k) => k.toLowerCase())

  for (const item of items) {
    if (!item || item.deleted || item.dead || !item.text || !item.time) continue
    if (item.time * 1000 < cutoffMs) continue

    const decoded = decodeHtml(item.text)
    const lower = decoded.toLowerCase()

    if (!filter(decoded)) continue
    if (!lowerKeywords.some((k) => lower.includes(k))) continue

    const postedAt = new Date(item.time * 1000)

    leads.push({
      source: 'hackernews',
      source_id: String(item.id),
      title: decoded.slice(0, 120).trim() + (decoded.length > 120 ? '…' : ''),
      body: decoded,
      url: hnItemUrl(item.id),
      author: item.by ?? 'unknown',
      posted_at: postedAt,
      freshness_score: freshnessScore(postedAt),
      intent_priority: INTENT_PRIORITY[bucket],
      bucket,
    })
  }

  return leads
}

function buildIntentQueries(keyword: string): string[] {
  return [
    `hiring ${keyword}`,
    `looking for ${keyword}`,
    `need ${keyword}`,
    `${keyword} wanted`,
  ]
}

export async function fetchHackerNewsLeads(
  skillKeywords: string[],
  maxAgeHours = 24
): Promise<Lead[]> {
  const cutoffUnix = Math.floor((Date.now() - maxAgeHours * 3_600_000) / 1000)
  const cutoffMs = cutoffUnix * 1000

  // Generic search now uses intent-qualified queries: "hiring X", "looking for X", "need X", "X wanted"
  const genericPromises: Promise<{ hits: AlgoliaHit[]; bucket: SourceBucket }>[] =
    skillKeywords.flatMap((kw) =>
      buildIntentQueries(kw).map(async (q) => ({
        hits: await searchAlgolia('(story,comment)', q, cutoffUnix),
        bucket: 'generic_keyword_search' as SourceBucket,
      }))
    )

  // Ask HN search per raw keyword — only keep hits where title contains hiring keywords
  const askHnPromises: Promise<{ hits: AlgoliaHit[]; bucket: SourceBucket }>[] =
    skillKeywords.map(async (kw) => ({
      hits: (await searchAlgolia('ask_hn', kw, cutoffUnix)).filter((h) =>
        HIRING_TITLE_RE.test(h.title ?? '')
      ),
      bucket: 'ask_hn_with_hiring_keywords' as SourceBucket,
    }))

  const whoIsHiringPromise = (async (): Promise<Lead[]> => {
    const threadId = await findLatestThreadByUser('whoishiring', 'Ask HN: Who is hiring?')
    if (!threadId) return []
    return fetchTopLevelComments(
      threadId,
      cutoffMs,
      () => true,
      skillKeywords,
      'whoishiring_comments'
    )
  })()

  const freelancerPromise = (async (): Promise<Lead[]> => {
    const threadId = await findLatestThreadByUser(
      'whoishiring',
      'Ask HN: Freelancer? Seeking freelancer?'
    )
    if (!threadId) return []
    return fetchTopLevelComments(
      threadId,
      cutoffMs,
      (text) => {
        const upper = text.toUpperCase()
        const seekingFreelancer = upper.includes('SEEKING FREELANCER')
        const seekingWork = upper.includes('SEEKING WORK') || upper.includes('FREELANCER SEEKING')
        if (seekingWork) return false
        if (seekingFreelancer) return true
        const lower = text.toLowerCase()
        return (
          lower.includes('looking to hire') ||
          lower.includes('need a ') ||
          lower.includes('hiring')
        )
      },
      skillKeywords,
      'freelancer_seeking_comments'
    )
  })()

  const [genericResults, askHnResults, whoIsHiringLeads, freelancerLeads] =
    await Promise.all([
      Promise.all(genericPromises),
      Promise.all(askHnPromises),
      whoIsHiringPromise,
      freelancerPromise,
    ])

  const searchLeads: Lead[] = []
  for (const { hits, bucket } of [...genericResults, ...askHnResults]) {
    for (const hit of hits) {
      const isComment = (hit._tags ?? []).includes('comment')
      searchLeads.push(hitToLead(hit, isComment, bucket))
    }
  }

  // Dedupe by source_id; on conflict, keep the higher intent_priority
  const dedupe = new Map<string, Lead>()
  for (const lead of [...whoIsHiringLeads, ...freelancerLeads, ...searchLeads]) {
    const existing = dedupe.get(lead.source_id)
    if (!existing || lead.intent_priority > existing.intent_priority) {
      dedupe.set(lead.source_id, lead)
    }
  }

  const all = Array.from(dedupe.values())
    .sort(
      (a, b) =>
        b.intent_priority - a.intent_priority ||
        b.posted_at.getTime() - a.posted_at.getTime()
    )
    .slice(0, ITEM_CAP)

  // Resolve author email per lead in parallel
  const withEmail = await Promise.all(
    all.map(async (lead) => ({
      ...lead,
      authorEmail: await getHNUserEmail(lead.author),
    }))
  )

  return withEmail
}

export type { Lead }
