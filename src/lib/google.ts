import { google } from 'googleapis'
import { createServiceClient } from '@/lib/supabase/service'

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
)

export async function getValidAccessToken(userId: string): Promise<string> {
  const supabase = createServiceClient()

  const { data: tokenRow, error } = await supabase
    .from('google_tokens')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !tokenRow) {
    throw new Error('No Google token found for user. Please reconnect Gmail.')
  }

  const isExpired = new Date(tokenRow.expires_at) <= new Date(Date.now() + 60_000)

  if (!isExpired) {
    return tokenRow.access_token
  }

  if (!tokenRow.refresh_token) {
    throw new Error('Access token expired and no refresh token available. Please reconnect Gmail.')
  }

  oauth2Client.setCredentials({ refresh_token: tokenRow.refresh_token })
  const { credentials } = await oauth2Client.refreshAccessToken()

  const newExpiresAt = new Date(credentials.expiry_date ?? Date.now() + 3600_000).toISOString()

  await supabase
    .from('google_tokens')
    .update({
      access_token: credentials.access_token!,
      expires_at: newExpiresAt,
    })
    .eq('user_id', userId)

  return credentials.access_token!
}

export function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )
}

export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/calendar.events',
]
