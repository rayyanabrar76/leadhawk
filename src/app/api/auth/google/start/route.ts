import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'

const STATE_COOKIE = 'gauth_state'
const NEXT_COOKIE = 'gauth_next'
const COOKIE_MAX_AGE = 600

export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url)
  const next = searchParams.get('next') ?? '/dashboard'

  const state = crypto.randomBytes(32).toString('base64url')
  const cookieStore = await cookies()

  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  }

  cookieStore.set(STATE_COOKIE, state, cookieOpts)
  cookieStore.set(NEXT_COOKIE, next, cookieOpts)

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${origin}/api/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online',
    prompt: 'select_account',
    state,
  })

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
}
