// Keyword-overlap fit score: how many of the user's expanded skill keywords
// appear in the lead's title/body/tags. Returns 0-100. Cheap, no AI calls.

interface FitInputs {
  title: string
  body?: string | null
  tags?: string[] | null
  company_name?: string | null
}

export function calculateFitScore(keywords: string[], lead: FitInputs): number {
  const valid = keywords
    .map((k) => k.toLowerCase().trim())
    .filter((k) => k.length >= 2)

  if (valid.length === 0) {
    console.log(`[fit] ZERO for "${lead.title.slice(0, 50)}" — no valid keywords`)
    return 0
  }

  const haystack = [
    lead.title ?? '',
    lead.body ?? '',
    lead.company_name ?? '',
    ...(lead.tags ?? []),
  ]
    .join(' ')
    .toLowerCase()

  let matches = 0
  for (const kw of valid) {
    if (haystack.includes(kw)) matches++
  }

  // Any match = at least 25 (passes threshold), more matches = higher score.
  // Old formula (matches/total)*100 broke when keyword list grew large —
  // 1 match out of 15 = 7%, which unfairly filtered out relevant leads.
  const score = matches === 0
    ? 0
    : Math.min(100, Math.round(25 + (matches / valid.length) * 75))
  if (score === 0) {
    console.log(
      `[fit] ZERO for "${lead.title.slice(0, 50)}" — keywords: [${valid.join(', ')}], lead text sample: "${(lead.title + ' ' + (lead.body ?? '')).slice(0, 200).replace(/\s+/g, ' ')}"`
    )
  }
  return score
}
