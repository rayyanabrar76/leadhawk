-- Phase 1: Add 4 new lead sources (Remotive, RemoteOK, Arbeitnow, GitHub bounties).
-- Adds source_cache table for keyword/source-level caching, expands the leads
-- source check constraint, and adds new optional columns for company/job context
-- and a keyword-overlap fit_score.

-- 1. Source cache (server-side, non-user-scoped — service role only)
CREATE TABLE IF NOT EXISTS source_cache (
  source       text        NOT NULL,
  cache_key    text        NOT NULL DEFAULT '*',
  fetched_at   timestamptz NOT NULL DEFAULT now(),
  payload      jsonb       NOT NULL,
  PRIMARY KEY (source, cache_key)
);

-- No RLS — only service-role writes/reads from this cache.
ALTER TABLE source_cache DISABLE ROW LEVEL SECURITY;

-- 2. Expand leads.source check constraint
ALTER TABLE leads
  DROP CONSTRAINT IF EXISTS leads_source_check;

ALTER TABLE leads
  ADD CONSTRAINT leads_source_check
  CHECK (source IN (
    'reddit',
    'hackernews',
    'remotive',
    'remoteok',
    'arbeitnow',
    'github_bounties'
  ));

-- 3. New columns for job-board / company context + fit score
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS company_logo text,
  ADD COLUMN IF NOT EXISTS salary       text,
  ADD COLUMN IF NOT EXISTS apply_url    text,
  ADD COLUMN IF NOT EXISTS tags         text[],
  ADD COLUMN IF NOT EXISTS fit_score    int;
