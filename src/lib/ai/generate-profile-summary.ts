import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(
  process.env.GOOGLE_API_KEY ?? process.env.GEMINI_API_KEY ?? ''
)

export interface ProfileSummaryInput {
  bio?: string | null
  years_experience?: number | null
  hourly_rate_min?: number | null
  hourly_rate_max?: number | null
  preferred_engagement?: string[] | null
  industries?: string[] | null
  tech_stack?: string[] | null
  resume_text?: string | null
  portfolio_items?: Array<{
    title: string
    description?: string | null
    tech_used?: string[] | null
    outcome?: string | null
  }>
}

const MAX_RESUME_CHARS = 8000

export async function generateProfileSummary(input: ProfileSummaryInput): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })

  const portfolioBlock = (input.portfolio_items ?? [])
    .map(
      (p, i) =>
        `${i + 1}. ${p.title}${p.description ? ` — ${p.description}` : ''}${p.outcome ? ` Result: ${p.outcome}` : ''}${p.tech_used && p.tech_used.length ? ` (${p.tech_used.join(', ')})` : ''}`
    )
    .join('\n')

  const rateLine =
    input.hourly_rate_min && input.hourly_rate_max
      ? `$${input.hourly_rate_min}–$${input.hourly_rate_max}/hr`
      : input.hourly_rate_min
        ? `$${input.hourly_rate_min}+/hr`
        : 'not specified'

  const prompt = `You are creating a rich semantic profile of a freelancer for matching them to job leads.

Inputs:
- Bio: ${input.bio ?? '(not provided)'}
- Years of experience: ${input.years_experience ?? '(not provided)'}
- Hourly rate: ${rateLine}
- Preferred engagement: ${(input.preferred_engagement ?? []).join(', ') || '(not provided)'}
- Tech stack: ${(input.tech_stack ?? []).join(', ') || '(not provided)'}
- Industries: ${(input.industries ?? []).join(', ') || '(not provided)'}
- Portfolio items:
${portfolioBlock || '(none provided)'}
- Resume text:
${(input.resume_text ?? '').slice(0, MAX_RESUME_CHARS) || '(not provided)'}

Generate a 200-300 word profile that captures:
- Core competencies (specific, not generic)
- Domain experience (industries, company stages, deal sizes)
- Notable projects with concrete outcomes
- Engagement preferences and availability
- What types of work they're best suited for
- What types of work they should AVOID

This summary will be fed into another AI call later to score each job lead's fit. Be specific and dense — every sentence should help discriminate good leads from bad ones.

Output plain text, no markdown, no preamble.`

  const result = await model.generateContent(prompt)
  const text = result.response.text().trim()
  return text
}
