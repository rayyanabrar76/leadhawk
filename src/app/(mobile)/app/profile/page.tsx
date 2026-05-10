import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MobileHeader } from '@/components/mobile/mobile-header'
import { ProfileClient } from './profile-client'

export default async function MobileProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/app')

  const { data: profile } = await supabase
    .from('profiles')
    .select(
      'email, skill, bio, years_experience, hourly_rate_min, hourly_rate_max, preferred_engagement, industries, tech_stack, portfolio_url, linkedin_url, github_url, resume_filename, resume_uploaded_at, profile_summary, profile_summary_generated_at'
    )
    .eq('id', user.id)
    .single()

  const { data: portfolio } = await supabase
    .from('portfolio_items')
    .select('id, title, url, description, tech_used, outcome, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const { data: googleToken } = await supabase
    .from('google_tokens')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  return (
    <div className="h-dvh overflow-y-auto pb-16">
      <MobileHeader />
      <ProfileClient
        email={profile?.email ?? user.email ?? ''}
        profile={profile ?? null}
        portfolio={portfolio ?? []}
        gmailConnected={Boolean(googleToken)}
      />
    </div>
  )
}