import { google } from 'googleapis'
import { getValidAccessToken, getOAuthClient } from '@/lib/google'

export async function sendEmail(
  userId: string,
  to: string,
  subject: string,
  body: string
): Promise<string> {
  const accessToken = await getValidAccessToken(userId)

  const auth = getOAuthClient()
  auth.setCredentials({ access_token: accessToken })

  const gmail = google.gmail({ version: 'v1', auth })

  const message = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    '',
    body,
  ].join('\n')

  const encoded = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  const res = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: encoded },
  })

  return res.data.id!
}
