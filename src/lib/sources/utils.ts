// Shared helpers used by every source fetcher.

export function freshnessScore(postedAt: Date): number {
  const hoursOld = (Date.now() - postedAt.getTime()) / 3_600_000
  return Math.max(0, Math.round(100 - hoursOld * 4))
}

export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// Match any user keyword against a haystack (case-insensitive).
// Used by sources that get a single firehose and need to filter client-side.
export function anyKeywordMatch(haystack: string, keywords: string[]): boolean {
  const lower = haystack.toLowerCase()
  for (const kw of keywords) {
    const term = kw.toLowerCase().trim()
    if (term.length >= 2 && lower.includes(term)) return true
  }
  return false
}
