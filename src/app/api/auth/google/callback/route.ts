import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const STATE_COOKIE = 'gauth_state'
const NEXT_COOKIE = 'gauth_next'

function errorRedirect(origin: string, code: string) {
  return NextResponse.redirect(`${origin}/?auth=login&error=${code}`)
}

export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const oauthError = searchParams.get('error')

  const cookieStore = await cookies()
  const expectedState = cookieStore.get(STATE_COOKIE)?.value
  const next = cookieStore.get(NEXT_COOKIE)?.value ?? '/dashboard'

  cookieStore.delete(STATE_COOKIE)
  cookieStore.delete(NEXT_COOKIE)

  if (oauthError || !code || !state || !expectedState || state !== expectedState) {
    return errorRedirect(origin, 'oauth_failed')
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${origin}/api/auth/google/callback`,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) {
    return errorRedirect(origin, 'token_exchange_failed')
  }

  const tokens = await tokenRes.json() as { id_token?: string }
  const idToken = tokens.id_token

  if (!idToken) {
    return errorRedirect(origin, 'no_id_token')
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      '',
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { error: signInError } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  })

  if (signInError) {
    return errorRedirect(origin, 'session_failed')
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, skill')
      .eq('id', user.id)
      .single()

    if (!profile) {
      await supabase.from('profiles').insert({ id: user.id, email: user.email })
      return NextResponse.redirect(`${origin}/onboarding`)
    }
    if (!profile.skill) {
      return NextResponse.redirect(`${origin}/onboarding`)
    }
  }

  return NextResponse.redirect(`${origin}${next}`)
}
