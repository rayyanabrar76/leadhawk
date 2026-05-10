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
    .select('skill, email')
    .eq('id', user.id)
    .single()

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
        skill={profile?.skill ?? ''}
        gmailConnected={Boolean(googleToken)}
      />
    </div>
  )
}