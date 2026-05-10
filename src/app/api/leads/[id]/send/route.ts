import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendEmail } from '@/lib/google/gmail'
import { fetchHackerNewsLeads } from '@/lib/sources/hackernews'

async function getHNAuthorEmail(author: string): Promise<string | null> {
  try {
    const res = await fetch(`https://hacker-news.firebaseio.com/v0/user/${author}.json`)
    if (!res.ok) return null
    const user = await res.json()
    const about: string = user?.about ?? ''
    const match = about.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/)
    return match ? match[0] : null
  } catch {
    return null
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: lead } = await supabase
    .from('leads')
    .select('*, pitches(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  }

  const body = await req.json().catch(() => ({}))
  const pitch = body.subject && body.body
    ? { subject: body.subject, body: body.body }
    : lead.pitches?.[0]

  if (!pitch) {
    return NextResponse.json({ error: 'No pitch drafted yet' }, { status: 400 })
  }

  let toEmail: string | null = null

  if (lead.source === 'hackernews') {
    toEmail = await getHNAuthorEmail(lead.author)
  }

  if (!toEmail) {
    const service = createServiceClient()
    await service.from('leads').update({ status: 'no_email' }).eq('id', id)
    return NextResponse.json({ error: 'No email found for this lead author' }, { status: 422 })
  }

  const gmailMessageId = await sendEmail(user.id, toEmail, pitch.subject, pitch.body)

  const service = createServiceClient()

  await service
    .from('pitches')
    .update({ sent_at: new Date().toISOString(), gmail_message_id: gmailMessageId })
    .eq('lead_id', id)

  await service
    .from('leads')
    .update({ status: 'sent' })
    .eq('id', id)

  return NextResponse.json({ sent: true, to: toEmail, gmail_message_id: gmailMessageId })
}
