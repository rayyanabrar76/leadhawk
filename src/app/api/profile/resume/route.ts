import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAllowedMime, parseResume } from '@/lib/parsers/resume'
import { refreshProfileSummary } from '@/lib/profile/refresh-summary'

const MAX_BYTES = 5 * 1024 * 1024 // 5MB

export const runtime = 'nodejs' // pdf-parse + mammoth need Node, not edge

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const form = await request.formData().catch(() => null)
  const file = form?.get('file')
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 413 })
  }

  if (!isAllowedMime(file.type)) {
    return NextResponse.json(
      { error: 'Only PDF and DOCX files are supported' },
      { status: 415 }
    )
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  let text: string
  try {
    text = await parseResume(buffer, file.type)
  } catch (err) {
    console.error('[resume] parse failed:', err)
    return NextResponse.json(
      { error: 'Could not read this file. Try a different export.' },
      { status: 422 }
    )
  }

  if (text.length < 50) {
    return NextResponse.json(
      { error: 'Extracted text is too short. Is the file a real resume?' },
      { status: 422 }
    )
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      resume_text: text,
      resume_filename: file.name,
      resume_uploaded_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    console.error('[resume] save failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await refreshProfileSummary(user.id)

  return NextResponse.json({
    ok: true,
    filename: file.name,
    text_length: text.length,
  })
}
