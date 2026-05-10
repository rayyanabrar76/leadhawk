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

export async function generateKeywordVariations(profile: ProfileContext): Promise<string[]> {
  const lines: string[] = [`Skill: ${profile.skill}`]
  if (profile.techStack?.length) lines.push(`Tech stack: ${profile.techStack.join(', ')}`)
  if (profile.industries?.length) lines.push(`Industries: ${profile.industries.join(', ')}`)
  if (profile.bio) lines.push(`Bio: ${profile.bio.slice(0, 300)}`)

  const prompt = `You are helping a freelancer find job postings and contract opportunities online.

Freelancer profile:
${lines.join('\n')}

Generate 8-12 short keyword phrases (2-4 words each) that hiring managers or startup founders would write when posting a job or contract on Hacker News, Reddit, or job boards. Focus on their specific tech stack and industries. Include variations like "need <tech>", "<tech> developer", "<tech> freelancer", "<industry> <tech>".

Output ONLY a JSON array of strings, no markdown, no explanation:
["phrase1", "phrase2", ...]`

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })
    const result = await model.generateContent(prompt)
    const text = result.response.text().trim()

    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return [profile.skill]

    const keywords = JSON.parse(jsonMatch[0]) as string[]
    const unique = Array.from(new Set([profile.skill, ...keywords]))
    return unique.slice(0, 12)
  } catch (err) {
    console.warn('Gemini keyword expansion failed, falling back to skill only:', err instanceof Error ? err.message : err)
    return [profile.skill]
  }
}
