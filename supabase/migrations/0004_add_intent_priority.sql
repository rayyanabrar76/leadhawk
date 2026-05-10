-- Add intent_priority for source-bucket weighting + final_score ranking.
-- 100 = whoishiring comments, 90 = freelancer SEEKING comments,
-- 70 = ask_hn with hiring keywords, 30 = generic keyword search.
-- NULL on existing rows; refresh route backfills them by re-classifying.

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS intent_priority INT;

CREATE INDEX IF NOT EXISTS leads_intent_priority_idx
  ON public.leads(intent_priority);
