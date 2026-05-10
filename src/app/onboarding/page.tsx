import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Toaster } from '@/components/ui/sonner'
import { ProfileSetup } from '@/components/onboarding/profile-setup'
import { ConfirmedToast } from './confirmed-toast'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/?auth=login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('bio, years_experience, hourly_rate_min, hourly_rate_max, preferred_engagement, industries, tech_stack, portfolio_url, linkedin_url, github_url')
    .eq('id', user.id)
    .single()

  return (
    <>
      <Toaster position="top-center" theme="dark" />
      <Suspense fallback={null}>
        <ConfirmedToast />
      </Suspense>
      <ProfileSetup initialProfile={profile ?? null} />
    </>
  )
}
