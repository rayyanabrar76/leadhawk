import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from './dashboard-client'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/?auth=login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('skill, email')
    .eq('id', user.id)
    .single()

  if (!profile?.skill) redirect('/onboarding')

  const { data: googleToken } = await supabase
    .from('google_tokens')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  const { data: leads } = await supabase
    .from('leads')
    .select('*, pitches(*)')
    .eq('user_id', user.id)
    .limit(100)

  // Sort by final_score = freshness * 0.4 + intent_priority * 0.6 (NULL priority → 0)
  const sorted = (leads ?? [])
    .map((l) => ({
      ...l,
      final_score:
        (l.freshness_score ?? 0) * 0.4 + (l.intent_priority ?? 0) * 0.6,
    }))
    .sort((a, b) => b.final_score - a.final_score)

  return (
    <DashboardClient
      initialLeads={sorted}
      skill={profile.skill}
      userEmail={profile.email ?? user.email ?? ''}
      hasGoogleToken={Boolean(googleToken)}
    />
  )
}
