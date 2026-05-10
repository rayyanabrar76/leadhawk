import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY ?? process.env.GEMINI_API_KEY ?? '')

interface PitchInput {
  title: string
  body: string
  userSkill: string
  userEmail: string
}

interface Pitch {
  subject: string
  body: string
}

export async function draftPitch(input: PitchInput): Promise<Pitch> {
  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })

  const prompt = `You are writing a short, personal cold email from a freelancer to someone who just posted online that they need help.

Freelancer's skill: ${input.userSkill}
Freelancer's email: ${input.userEmail}

Post title: ${input.title}
Post content: ${input.body.slice(0, 1500)}

Write a 4-6 sentence email. Tone: warm, specific, not salesy. Reference one concrete detail from their post. End with a soft CTA (15-min call this week?).

Output ONLY valid JSON in this exact format, no markdown, no preamble:
{"subject": "string", "body": "string"}`

  const result = await model.generateContent(prompt)
  const text = result.response.text().trim()

  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Gemini did not return valid JSON')
  }

  const parsed = JSON.parse(jsonMatch[0]) as Pitch

  if (!parsed.subject || !parsed.body) {
    throw new Error('Gemini response missing subject or body')
  }

  return parsed
}

interface ProfileContext {
  skill: string
  bio?: string | null
  techStack?: string[] | null
  industries?: string[] | null
}

export function generateKeywordVariations(profile: ProfileContext): string[] {
  const kw = new Set<string>()

  kw.add(profile.skill)

  const stack = profile.techStack ?? []
  const industries = profile.industries ?? []

  // Per-tech variations
  for (const tech of stack) {
    kw.add(`${tech} developer`)
    kw.add(`${tech} freelancer`)
    kw.add(`need ${tech}`)
  }

  // Top-2 tech combinations
  if (stack.length >= 2) {
    kw.add(`${stack[0]} ${stack[1]}`)
  }

  // Industry + primary tech
  const primaryTech = stack[0]
  if (primaryTech) {
    for (const industry of industries.slice(0, 3)) {
      kw.add(`${industry} ${primaryTech}`.toLowerCase())
    }
  }

  // Generic role terms from skill words
  const skillWords = profile.skill.toLowerCase().split(/\s+/)
  if (skillWords.includes('developer') || skillWords.includes('engineer')) {
    kw.add('frontend developer')
    kw.add('frontend freelancer')
  }
  if (skillWords.includes('fullstack') || skillWords.includes('full-stack') || skillWords.includes('full')) {
    kw.add('fullstack developer')
    kw.add('full stack developer')
  }

  const result = Array.from(kw).slice(0, 15)
  return result
}
