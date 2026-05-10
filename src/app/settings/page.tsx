import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Logo } from '@/components/Logo'
import { ArrowLeft } from 'lucide-react'
import { SettingsClient } from './settings-client'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/?auth=login')

  const [{ data: profile }, { data: portfolio }] = await Promise.all([
    supabase
      .from('profiles')
      .select(
        'email, skill, bio, years_experience, hourly_rate_min, hourly_rate_max, preferred_engagement, industries, tech_stack, portfolio_url, linkedin_url, github_url, resume_filename, resume_uploaded_at, profile_summary, profile_summary_generated_at'
      )
      .eq('id', user.id)
      .single(),
    supabase
      .from('portfolio_items')
      .select('id, title, url, description, tech_used, outcome, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <h1 className="text-sm font-semibold text-zinc-100">Profile settings</h1>
          <Logo variant="full" size="sm" />
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-20">
        <SettingsClient
          email={profile?.email ?? user.email ?? ''}
          profile={profile ?? null}
          portfolio={portfolio ?? []}
        />
      </main>
    </div>
  )
}
