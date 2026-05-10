'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { MobileHeader } from '@/components/mobile/mobile-header'
import { InstallBanner } from '@/components/mobile/install-banner'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import { type Lead, type LeadSource, viewLinkLabel } from '@/components/lead-card'
import { formatDistanceToNow } from '@/lib/time'
import {
  ChevronRight,
  Newspaper,
  Briefcase,
  Code2,
  Target,
  Star,
  Circle,
  Flame,
  Clock,
  Check,
  ExternalLink,
  Inbox as InboxIcon,
} from 'lucide-react'

function sourceAvatar(source: LeadSource): { Icon: typeof Newspaper; cls: string } {
  switch (source) {
    case 'remotive':
      return { Icon: Briefcase, cls: 'bg-emerald-600/15 border-emerald-600/30 text-emerald-400' }
    case 'remoteok':
      return { Icon: Briefcase, cls: 'bg-cyan-600/15 border-cyan-600/30 text-cyan-400' }
    case 'arbeitnow':
      return { Icon: Briefcase, cls: 'bg-indigo-600/15 border-indigo-600/30 text-indigo-400' }
    case 'github_bounties':
      return { Icon: Code2, cls: 'bg-zinc-700/40 border-zinc-600 text-zinc-200' }
    case 'reddit':
      return { Icon: Newspaper, cls: 'bg-orange-600/15 border-orange-600/30 text-orange-400' }
    case 'hackernews':
    default:
      return { Icon: Newspaper, cls: 'bg-amber-600/15 border-amber-600/30 text-amber-400' }
  }
}

function IntentDot({ priority }: { priority: number }) {
  if (priority >= 80) return <Target className="w-3.5 h-3.5 text-violet-400" />
  if (priority >= 50) return <Star className="w-3.5 h-3.5 text-blue-400" />
  return <Circle className="w-2.5 h-2.5 text-zinc-600" />
}

function FreshnessIcon({ score }: { score: number }) {
  if (score >= 76) return <Flame className="w-3.5 h-3.5 text-orange-400" />
  if (score >= 40) return <Clock className="w-3.5 h-3.5 text-zinc-500" />
  return null
}

interface Props {
  initialLeads: Lead[]
}

export function MobileLeadsClient({ initialLeads }: Props) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [refreshing, setRefreshing] = useState(false)
  const [highIntentOnly, setHighIntentOnly] = useState(false)
  const supabase = createClient()

  async function handleRefresh() {
    setRefreshing(true)
    try {
      const res = await fetch('/api/leads/refresh', { method: 'POST' })
      const text = await res.text()
      let data: { error?: string; inserted?: number; candidates?: number; dropped?: number } = {}
      try { data = JSON.parse(text) } catch { throw new Error('Server error') }
      if (!res.ok) throw new Error(data.error ?? 'Refresh failed')

      const { data: fresh } = await supabase
        .from('leads')
        .select('*, pitches(*)')
        .limit(100)

      if (fresh) {
        const sorted = (fresh as Lead[])
          .map((l) => ({
            ...l,
            final_score:
              (l.freshness_score ?? 0) * 0.4 + (l.intent_priority ?? 0) * 0.6,
          }))
          .sort((a, b) => (b.final_score ?? 0) - (a.final_score ?? 0))
        setLeads(sorted)
      }
      toast.success(`Found ${data.inserted ?? 0} leads`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Refresh failed')
    }
    setRefreshing(false)
  }

  const filteredLeads = leads
    .filter((l) => l.status !== 'skipped')
    .filter((l) => !highIntentOnly || (l.intent_priority ?? 0) >= 70)

  return (
    <>
      <Toaster position="top-center" theme="dark" />
      <MobileHeader onRefresh={handleRefresh} refreshing={refreshing} />

      <InstallBanner />

      {/* High intent toggle row */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <p className="text-xs text-zinc-500">
          {filteredLeads.length} {filteredLeads.length === 1 ? 'lead' : 'leads'}
        </p>
        <button
          onClick={() => setHighIntentOnly((v) => !v)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
            highIntentOnly
              ? 'bg-violet-500/15 text-violet-300 border border-violet-500/30'
              : 'text-zinc-500 border border-zinc-800'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          High intent
        </button>
      </div>

      {filteredLeads.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center px-6 py-20 text-zinc-500">
          <InboxIcon className="w-12 h-12 text-zinc-700 mb-4" />
          <p className="text-sm font-medium text-zinc-300 mb-1">No leads yet</p>
          <p className="text-xs">Tap the refresh icon to scan Hacker News.</p>
        </div>
      ) : (
        <ul className="divide-y divide-zinc-800/60">
          {filteredLeads.map((lead) => {
            const avatar = sourceAvatar(lead.source)
            const AvatarIcon = avatar.Icon
            return (
            <li key={lead.id}>
              <Link
                href={`/app/leads/${lead.id}`}
                className="flex items-start gap-3 px-4 py-4 active:bg-zinc-900/60 transition-colors"
              >
                <div className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 ${avatar.cls}`}>
                  <AvatarIcon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-zinc-100 line-clamp-2 leading-snug flex-1">
                      {lead.title}
                    </h3>
                    {lead.status === 'sent' && (
                      <Check className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-zinc-500 flex-wrap">
                    <IntentDot priority={lead.intent_priority ?? 0} />
                    <FreshnessIcon score={lead.freshness_score} />
                    <span className="truncate">{lead.company_name ?? lead.author}</span>
                    <span>·</span>
                    <span>{formatDistanceToNow(lead.posted_at)}</span>
                    {lead.status === 'no_email' && (
                      <span className="inline-flex items-center gap-0.5 text-yellow-500/80">
                        <ExternalLink className="w-3 h-3" />
                        {viewLinkLabel(lead.source).replace(/^View on /, '')}
                      </span>
                    )}
                    {lead.status === 'drafted' && (
                      <span className="text-violet-400 font-medium">Drafted</span>
                    )}
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-zinc-700 shrink-0 mt-3" />
              </Link>
            </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
