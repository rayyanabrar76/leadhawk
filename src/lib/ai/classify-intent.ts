import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY ?? process.env.GEMINI_API_KEY ?? '')

interface IntentInput {
  source_id: string
  title: string
  body: string
}

const cache = new Map<string, boolean>()

export async function classifyLeadIntent(lead: IntentInput): Promise<boolean> {
  if (cache.has(lead.source_id)) return cache.get(lead.source_id)!

  const prompt = `You are filtering posts to find people who want to PAY a freelancer/contractor for work.

Read this post and decide: is this person actively looking to HIRE or PAY someone for help right now?

YES means: hiring, looking to hire, seeking freelancer, need someone to build/fix/design X, willing to pay, posting a job, asking for recommendations of people to hire.

NO means: ranting, venting, sharing opinions, asking technical questions, showing off a project, debating, asking for free advice, looking for a job themselves (job seekers, not employers), discussing tools/tech in general.

Post title: ${lead.title}
Post body: ${lead.body.slice(0, 1500)}

Reply with ONLY one word: YES or NO.`

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })
    const result = await model.generateContent(prompt)
    const text = result.response.text().trim().toUpperCase()
    const yes = text.startsWith('YES')
    cache.set(lead.source_id, yes)
    return yes
  } catch (err) {
    console.warn(
      `Intent classify failed for ${lead.source_id}, defaulting to YES:`,
      err instanceof Error ? err.message : err
    )
    return true // fail-open so a Gemini outage doesn't drop everything
  }
}

export async function classifyManyWithConcurrency<T extends IntentInput>(
  leads: T[],
  limit = 5
): Promise<{ kept: T[]; dropped: number }> {
  const kept: T[] = []
  let dropped = 0
  let next = 0

  async function worker() {
    while (next < leads.length) {
      const i = next++
      const lead = leads[i]
      const yes = await classifyLeadIntent(lead)
      if (yes) kept.push(lead)
      else dropped++
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, leads.length) }, () => worker())
  )

  return { kept, dropped }
}
