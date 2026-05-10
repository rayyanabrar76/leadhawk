import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MobileLeadsClient } from './leads-client'
import type { Lead } from '@/components/lead-card'

export default async function MobileLeadsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/app')

  const { data: profile } = await supabase
    .from('profiles')
    .select('skill')
    .eq('id', user.id)
    .single()

  if (!profile?.skill) redirect('/onboarding')

  const { data: leads } = await supabase
    .from('leads')
    .select('*, pitches(*)')
    .eq('user_id', user.id)
    .limit(100)

  const sorted = (leads ?? [])
    .map((l) => ({
      ...l,
      final_score:
        (l.freshness_score ?? 0) * 0.4 + (l.intent_priority ?? 0) * 0.6,
    }))
    .sort((a, b) => b.final_score - a.final_score)

  return <MobileLeadsClient initialLeads={sorted as Lead[]} />
}
