import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

// Hard-deletes the user's auth.users row. The profile, leads, pitches,
// portfolio_items, and google_tokens tables all cascade ON DELETE so the
// row removal there cleans everything up automatically.
export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()
  const { error } = await service.auth.admin.deleteUser(user.id)

  if (error) {
    console.error('[account DELETE] failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Drop the local session so the next page load doesn't think they're still in
  await supabase.auth.signOut()

  return NextResponse.json({ ok: true })
}
