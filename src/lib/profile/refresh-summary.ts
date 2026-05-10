import { createServiceClient } from '@/lib/supabase/service'
import { generateProfileSummary } from '@/lib/ai/generate-profile-summary'

// Re-runs the Gemini profile summary using the latest profile + portfolio rows
// and writes the result back to profiles.profile_summary. Caller decides when
// to trigger this — typically after any profile mutation.
export async function refreshProfileSummary(userId: string): Promise<void> {
  const service = createServiceClient()

  const [{ data: profile }, { data: portfolio }] = await Promise.all([
    service
      .from('profiles')
      .select(
        'bio, years_experience, hourly_rate_min, hourly_rate_max, preferred_engagement, industries, tech_stack, resume_text'
      )
      .eq('id', userId)
      .single(),
    service
      .from('portfolio_items')
      .select('title, description, tech_used, outcome')
      .eq('user_id', userId)
      .order('created_at', { ascending: true }),
  ])

  if (!profile) return

  // Skip if there's nothing to summarize — saves a Gemini call when fields are empty
  const hasContent =
    Boolean(profile.bio) ||
    Boolean(profile.resume_text) ||
    (profile.tech_stack && profile.tech_stack.length > 0) ||
    (portfolio && portfolio.length > 0)

  if (!hasContent) return

  try {
    const summary = await generateProfileSummary({
      bio: profile.bio,
      years_experience: profile.years_experience,
      hourly_rate_min: profile.hourly_rate_min,
      hourly_rate_max: profile.hourly_rate_max,
      preferred_engagement: profile.preferred_engagement,
      industries: profile.industries,
      tech_stack: profile.tech_stack,
      resume_text: profile.resume_text,
      portfolio_items: portfolio ?? [],
    })

    await service
      .from('profiles')
      .update({
        profile_summary: summary,
        profile_summary_generated_at: new Date().toISOString(),
      })
      .eq('id', userId)
  } catch (err) {
    console.error('[refreshProfileSummary] Gemini failed:', err)
    // Don't throw — profile mutation succeeded, summary regen is best-effort
  }
}
