'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { LeadCard, type Lead } from '@/components/lead-card'
import { LeadCardSkeleton } from '@/components/lead-card'
import { LeadDrawer } from '@/components/lead-drawer'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import { RefreshCw, Wifi, WifiOff, LogOut, Target } from 'lucide-react'
import { Logo } from '@/components/Logo'

interface Props {
  initialLeads: Lead[]
  skill: string
  userEmail: string
  hasGoogleToken: boolean
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="border border-border rounded-lg p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-2xl font-mono font-bold ${color}`}>{value}</p>
    </div>
  )
}

function computeFinalScore(l: Lead): number {
  return (l.freshness_score ?? 0) * 0.4 + (l.intent_priority ?? 0) * 0.6
}

export function DashboardClient({ initialLeads, skill, hasGoogleToken }: Props) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | 'new' | 'drafted' | 'sent' | 'skipped'>('all')
  const [highIntentOnly, setHighIntentOnly] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  const today = new Date().toDateString()
  const todayLeads = leads.filter((l) => new Date(l.created_at ?? l.posted_at).toDateString() === today)

  const stats = {
    new: todayLeads.filter((l) => l.status === 'new' || l.status === 'no_email').length,
    drafted: todayLeads.filter((l) => l.status === 'drafted').length,
    sent: todayLeads.filter((l) => l.status === 'sent').length,
    skipped: todayLeads.filter((l) => l.status === 'skipped').length,
  }

  const filteredLeads = (filter === 'all'
    ? leads.filter((l) => l.status !== 'skipped')
    : leads.filter((l) => {
        if (filter === 'new') return l.status === 'new' || l.status === 'no_email'
        return l.status === filter
      })
  ).filter((l) => !highIntentOnly || (l.intent_priority ?? 0) >= 70)

  async function handleRefresh() {
    setRefreshing(true)
    try {
      const res = await fetch('/api/leads/refresh', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Refresh failed')

      const { data: fresh } = await supabase
        .from('leads')
        .select('*, pitches(*)')
        .limit(100)

      if (fresh) {
        const sorted = [...(fresh as Lead[])].sort(
          (a, b) => computeFinalScore(b) - computeFinalScore(a)
        )
        setLeads(sorted)
      }

      const candidates = data.candidates ?? data.inserted
      const dropped = data.dropped ?? 0
      toast.success(
        `Found ${data.inserted} leads (filtered ${dropped} of ${candidates})`
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Refresh failed')
    }
    setRefreshing(false)
  }

  const updateLeadLocally = useCallback((id: string, updates: Partial<Lead>) => {
    setLeads((prev) => prev.map((l) => l.id === id ? { ...l, ...updates } : l))
    setSelectedLead((prev) => prev?.id === id ? { ...prev, ...updates } : prev)
  }, [])

  async function handleDraft(leadId: string) {
    try {
      const res = await fetch(`/api/leads/${leadId}/draft`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Draft failed')

      updateLeadLocally(leadId, {
        status: 'drafted',
        pitches: [data.pitch],
      })
      toast.success('Pitch drafted')

      const lead = leads.find((l) => l.id === leadId)
      if (lead && !drawerOpen) {
        setSelectedLead({ ...lead, status: 'drafted', pitches: [data.pitch] })
        setDrawerOpen(true)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Draft failed')
    }
  }

  async function handleSend(leadId: string, subject: string, body: string) {
    const res = await fetch(`/api/leads/${leadId}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, body }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? 'Send failed')

    updateLeadLocally(leadId, { status: 'sent' })
    toast.success(`Sent to ${data.to}`)
    setDrawerOpen(false)
  }

  async function handleSkip(leadId: string) {
    try {
      await fetch(`/api/leads/${leadId}/skip`, { method: 'POST' })
      updateLeadLocally(leadId, { status: 'skipped' })
      toast('Lead skipped')
    } catch {
      toast.error('Failed to skip')
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const FILTERS = ['all', 'new', 'drafted', 'sent', 'skipped'] as const

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" theme="dark" />

      {/* Top bar */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="sm:hidden">
              <Logo variant="icon" size="sm" href="/dashboard" />
            </div>
            <div className="hidden sm:block shrink-0">
              <Logo variant="full" size="sm" href="/dashboard" />
            </div>

            <div className="flex-1 min-w-0 hidden sm:block">
              <p className="text-xs text-muted-foreground truncate">
                <span className="text-foreground/70">{skill}</span>
              </p>
            </div>

            <div className="flex-1 sm:flex-none" />

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {hasGoogleToken ? (
                <span
                  className="inline-flex items-center gap-1 text-xs text-green-500"
                  title="Gmail connected"
                  aria-label="Gmail connected"
                >
                  <Wifi className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Gmail</span>
                </span>
              ) : (
                <a href="/api/google/connect" aria-label="Connect Gmail">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs gap-1 border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10 px-2 sm:px-3"
                  >
                    <WifiOff className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Connect Gmail</span>
                  </Button>
                </a>
              )}

              <Button
                size="sm"
                className="h-8 text-xs gap-1 bg-violet-600 hover:bg-violet-700 px-2 sm:px-3"
                onClick={handleRefresh}
                disabled={refreshing}
                aria-label="Refresh leads"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{refreshing ? 'Scanning…' : 'Refresh leads'}</span>
              </Button>

              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-muted-foreground"
                onClick={handleLogout}
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Skill subtitle on its own row on mobile */}
          <p className="sm:hidden text-xs text-muted-foreground truncate mt-2 px-1">
            <span className="text-foreground/70">{skill}</span>
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="New leads" value={stats.new} color="text-violet-400" />
          <StatCard label="Drafted" value={stats.drafted} color="text-blue-400" />
          <StatCard label="Sent" value={stats.sent} color="text-green-400" />
          <StatCard label="Skipped" value={stats.skipped} color="text-muted-foreground" />
        </div>

        {/* Filter tabs + High intent toggle */}
        <div className="space-y-2 sm:space-y-0">
          <div className="flex items-center justify-between gap-2 border-b border-border flex-wrap">
            <div className="flex gap-1 overflow-x-auto scrollbar-none">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-2 text-xs font-medium capitalize transition-colors border-b-2 -mb-px whitespace-nowrap ${
                    filter === f
                      ? 'border-violet-500 text-violet-400'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <button
              onClick={() => setHighIntentOnly((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors mb-1 shrink-0 ${
                highIntentOnly
                  ? 'bg-violet-500/15 border-violet-500/30 text-violet-300'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">High intent only</span>
              <span className="sm:hidden">High intent</span>
            </button>
          </div>
        </div>

        {/* Lead list */}
        {refreshing && leads.length === 0 ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <LeadCardSkeleton key={i} />)}
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="flex flex-col items-center text-center py-16 text-muted-foreground">
            <div className="opacity-30 mb-4">
              <Logo variant="icon" size="lg" href={null} />
            </div>
            <p className="text-sm">No leads here yet.</p>
            {filter === 'all' && !highIntentOnly && (
              <p className="text-xs mt-1">
                Hit <span className="text-violet-400">Refresh leads</span> to scan Hacker News.
              </p>
            )}
            {highIntentOnly && leads.length > 0 && (
              <p className="text-xs mt-1">
                No high-intent leads — toggle the filter off to see medium and low.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredLeads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onSelect={(l) => { setSelectedLead(l); setDrawerOpen(true) }}
                onDraft={handleDraft}
                onSkip={handleSkip}
              />
            ))}
          </div>
        )}
      </main>

      <LeadDrawer
        lead={selectedLead}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onDraft={handleDraft}
        onSend={handleSend}
        onSkip={handleSkip}
      />
    </div>
  )
}
