import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(
  process.env.GOOGLE_API_KEY ?? process.env.GEMINI_API_KEY ?? ''
)

const INDUSTRY_OPTIONS = [
  'SaaS', 'Fintech', 'E-commerce', 'Healthtech', 'Edtech', 'Marketplaces',
  'Gaming', 'AI/ML', 'DevTools', 'Real Estate', 'Travel', 'Media',
]
const ENGAGEMENT_OPTIONS = ['Hourly', 'Project', 'Retainer', 'Full-time']

export interface ExtractedProfile {
  bio: string | null
  years_experience: number | null
  tech_stack: string[]
  industries: string[]
  preferred_engagement: string[]
  hourly_rate_min: number | null
  hourly_rate_max: number | null
  portfolio_url: string | null
  linkedin_url: string | null
  github_url: string | null
}

const MAX_RESUME_CHARS = 8000

export async function extractProfileFromResume(resumeText: string): Promise<ExtractedProfile> {
  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })

  const prompt = `Extract structured profile data from this resume. Return ONLY valid JSON, no markdown, no explanation:

{
  "bio": "2-3 sentence first-person professional summary highlighting speciality and value",
  "years_experience": <number or null>,
  "tech_stack": ["specific technologies used"],
  "industries": ["pick only from: ${INDUSTRY_OPTIONS.join(', ')}"],
  "preferred_engagement": ["pick only from: ${ENGAGEMENT_OPTIONS.join(', ')}"],
  "hourly_rate_min": <number or null>,
  "hourly_rate_max": <number or null>,
  "portfolio_url": "<url or null>",
  "linkedin_url": "<url or null>",
  "github_url": "<url or null>"
}

Resume:
${resumeText.slice(0, MAX_RESUME_CHARS)}`

  try {
    const result = await model.generateContent(prompt)
    const raw = result.response.text().trim()
    const json = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    const parsed = JSON.parse(json) as Partial<ExtractedProfile>
    return {
      bio: typeof parsed.bio === 'string' ? parsed.bio : null,
      years_experience: typeof parsed.years_experience === 'number' ? parsed.years_experience : null,
      tech_stack: Array.isArray(parsed.tech_stack) ? parsed.tech_stack : [],
      industries: Array.isArray(parsed.industries) ? parsed.industries : [],
      preferred_engagement: Array.isArray(parsed.preferred_engagement) ? parsed.preferred_engagement : [],
      hourly_rate_min: typeof parsed.hourly_rate_min === 'number' ? parsed.hourly_rate_min : null,
      hourly_rate_max: typeof parsed.hourly_rate_max === 'number' ? parsed.hourly_rate_max : null,
      portfolio_url: typeof parsed.portfolio_url === 'string' ? parsed.portfolio_url : null,
      linkedin_url: typeof parsed.linkedin_url === 'string' ? parsed.linkedin_url : null,
      github_url: typeof parsed.github_url === 'string' ? parsed.github_url : null,
    }
  } catch (err) {
    console.error('[extractProfileFromResume] failed:', err)
    return {
      bio: null, years_experience: null, tech_stack: [], industries: [],
      preferred_engagement: [], hourly_rate_min: null, hourly_rate_max: null,
      portfolio_url: null, linkedin_url: null, github_url: null,
    }
  }
}
