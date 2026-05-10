import { NextResponse } from 'next/server'
import { getOAuthClient, GOOGLE_SCOPES } from '@/lib/google'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', process.env.GOOGLE_REDIRECT_URI!.replace('/api/google/callback', '')))
  }

  const oauth2Client = getOAuthClient()

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: GOOGLE_SCOPES,
    prompt: 'consent',
    state: user.id,
  })

  return NextResponse.redirect(authUrl)
}
