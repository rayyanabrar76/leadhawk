export type SourceBucket =
  | 'whoishiring_comments'
  | 'freelancer_seeking_comments'
  | 'ask_hn_with_hiring_keywords'
  | 'generic_keyword_search'

export const INTENT_PRIORITY: Record<SourceBucket, number> = {
  whoishiring_comments: 100,
  freelancer_seeking_comments: 90,
  ask_hn_with_hiring_keywords: 70,
  generic_keyword_search: 30,
}

export interface Lead {
  source: 'reddit' | 'hackernews'
  source_id: string
  title: string
  body: string
  url: string
  author: string
  posted_at: Date
  freshness_score: number
  intent_priority: number
  bucket: SourceBucket
  authorEmail?: string | null
}
