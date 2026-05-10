import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MobileHeader } from '@/components/mobile/mobile-header'
import { Calendar as CalendarIcon } from 'lucide-react'

export default async function MobileCalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/app')

  return (
    <>
      <MobileHeader />
      <div className="flex flex-col items-center justify-center text-center px-6 py-20">
        <div className="rounded-full bg-zinc-900 p-5 mb-5">
          <CalendarIcon className="w-10 h-10 text-zinc-600" />
        </div>
        <h2 className="text-base font-semibold text-zinc-100 mb-2">Meetings is coming</h2>
        <p className="text-sm text-zinc-500 max-w-xs leading-relaxed">
          Booked calls from your prospects will show up here, synced to your Google Calendar.
        </p>
        <span className="mt-6 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-violet-500/10 text-violet-300 border border-violet-500/20">
          Coming in v2
        </span>
      </div>
    </>
  )
}
