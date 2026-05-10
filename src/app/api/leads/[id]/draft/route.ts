import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { draftPitch } from '@/lib/ai/draft-pitch'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (leadError || !lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('skill, email')
    .eq('id', user.id)
    .single()

  if (!profile?.skill) {
    return NextResponse.json({ error: 'No skill set' }, { status: 400 })
  }

  let pitch
  try {
    pitch = await draftPitch({
      title: lead.title,
      body: lead.body ?? '',
      userSkill: profile.skill,
      userEmail: profile.email ?? user.email ?? '',
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to draft pitch'
    if (msg.toLowerCase().includes('quota') || msg.includes('429')) {
      return NextResponse.json(
        { error: 'AI quota exhausted for today. Try again tomorrow or enable billing on the Gemini project.' },
        { status: 429 }
      )
    }
    console.error('Draft pitch error:', err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  const service = createServiceClient()

  const { data: savedPitch, error: pitchError } = await service
    .from('pitches')
    .upsert(
      { lead_id: id, subject: pitch.subject, body: pitch.body },
      { onConflict: 'lead_id' }
    )
    .select()
    .single()

  if (pitchError) {
    return NextResponse.json({ error: pitchError.message }, { status: 500 })
  }

  await service
    .from('leads')
    .update({ status: 'drafted' })
    .eq('id', id)

  return NextResponse.json({ pitch: savedPitch })
}
