import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MobileAuthScreen } from '@/components/mobile/auth-screen'

export default async function MobileAppEntry() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <MobileAuthScreen defaultMode="signup" />
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('skill')
    .eq('id', user.id)
    .single()

  if (!profile?.skill) {
    redirect('/onboarding')
  }

  redirect('/app/leads')
}
