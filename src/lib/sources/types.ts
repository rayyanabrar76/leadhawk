export type SourceBucket =
  | 'whoishiring_comments'
  | 'freelancer_seeking_comments'
  | 'ask_hn_with_hiring_keywords'
  | 'generic_keyword_search'
  | 'job_board'
  | 'github_bounty'

export const INTENT_PRIORITY: Record<SourceBucket, number> = {
  whoishiring_comments: 100,
  freelancer_seeking_comments: 90,
  job_board: 85,
  github_bounty: 80,
  ask_hn_with_hiring_keywords: 70,
  generic_keyword_search: 30,
}

export type LeadSource =
  | 'reddit'
  | 'hackernews'
  | 'remotive'
  | 'remoteok'
  | 'arbeitnow'
  | 'github_bounties'

export interface Lead {
  source: LeadSource
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
  // Job-board / company context (Remotive, RemoteOK, Arbeitnow)
  company_name?: string | null
  company_logo?: string | null
  salary?: string | null
  apply_url?: string | null
  tags?: string[] | null
  // Computed by orchestrator after all sources are fetched
  fit_score?: number
}
