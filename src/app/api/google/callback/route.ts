import { NextRequest, NextResponse } from 'next/server'
import { getOAuthClient } from '@/lib/google'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state') // user id
  const error = searchParams.get('error')

  const baseUrl = process.env.GOOGLE_REDIRECT_URI!.replace('/api/google/callback', '')

  if (error || !code || !state) {
    return NextResponse.redirect(`${baseUrl}/dashboard?google_error=access_denied`)
  }

  const oauth2Client = getOAuthClient()

  const { tokens } = await oauth2Client.getToken(code)

  if (!tokens.access_token) {
    return NextResponse.redirect(`${baseUrl}/dashboard?google_error=no_token`)
  }

  const expiresAt = new Date(tokens.expiry_date ?? Date.now() + 3600_000).toISOString()

  const supabase = createServiceClient()

  await supabase.from('google_tokens').upsert(
    {
      user_id: state,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? null,
      expires_at: expiresAt,
      scopes: tokens.scope ?? null,
    },
    { onConflict: 'user_id' }
  )

  return NextResponse.redirect(`${baseUrl}/dashboard?google_connected=1`)
}
