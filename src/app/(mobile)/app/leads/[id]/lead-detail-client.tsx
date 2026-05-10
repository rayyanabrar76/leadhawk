'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MobileHeader } from '@/components/mobile/mobile-header'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import type { Lead } from '@/components/lead-card'
import { formatDistanceToNow } from '@/lib/time'
import {
  Newspaper,
  ExternalLink,
  Sparkles,
  Send,
  Loader2,
  X,
  Check,
} from 'lucide-react'

interface Props {
  initialLead: Lead
}

export function LeadDetailClient({ initialLead }: Props) {
  const [lead, setLead] = useState<Lead>(initialLead)
  const [subject, setSubject] = useState(lead.pitches?.[0]?.subject ?? '')
  const [body, setBody] = useState(lead.pitches?.[0]?.body ?? '')
  const [drafting, setDrafting] = useState(false)
  const [sending, setSending] = useState(false)
  const router = useRouter()

  const hasPitch = Boolean(lead.pitches?.[0])
  const isSent = lead.status === 'sent'
  const isNoEmail = lead.status === 'no_email'

  async function handleDraft() {
    setDrafting(true)
    try {
      const res = await fetch(`/api/leads/${lead.id}/draft`, { method: 'POST' })
      const text = await res.text()
      let data: { error?: string; pitch?: { subject: string; body: string; sent_at: string | null } } = {}
      try { data = JSON.parse(text) } catch { throw new Error('Server error') }
      if (!res.ok || !data.pitch) throw new Error(data.error ?? 'Draft failed')
      setSubject(data.pitch.subject)
      setBody(data.pitch.body)
      setLead({ ...lead, status: 'drafted', pitches: [data.pitch] })
      toast.success('Pitch drafted')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Draft failed')
    }
    setDrafting(false)
  }

  async function handleSend() {
    setSending(true)
    try {
      const res = await fetch(`/api/leads/${lead.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, body }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Send failed')
      setLead({ ...lead, status: 'sent' })
      toast.success(`Sent to ${data.to}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Send failed')
    }
    setSending(false)
  }

  async function handleSkip() {
    try {
      await fetch(`/api/leads/${lead.id}/skip`, { method: 'POST' })
      toast('Lead skipped')
      router.back()
    } catch {
      toast.error('Failed to skip')
    }
  }

  return (
    <>
      <Toaster position="top-center" theme="dark" />
      <MobileHeader title="Lead" showBack />

      <div className="lh-slide-in">
        {/* Lead meta */}
        <div className="px-4 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2 mb-2 text-xs">
            <span className="inline-flex items-center gap-1 text-amber-400 font-mono font-semibold">
              <Newspaper className="w-3.5 h-3.5" />
              Hacker News
            </span>
            <span className="text-zinc-600">·</span>
            <span className="text-zinc-500 font-mono">{formatDistanceToNow(lead.posted_at)}</span>
          </div>
          <h2 className="text-base font-semibold text-zinc-50 leading-snug mb-2">
            {lead.title}
          </h2>
          <p className="text-xs text-zinc-500">by {lead.author}</p>
          <a
            href={lead.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-xs text-violet-400 mt-2"
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            View on HN
          </a>
        </div>

        {/* Lead body */}
        {lead.body && (
          <div className="px-4 py-4 border-b border-zinc-800">
            <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
              {lead.body}
            </p>
          </div>
        )}

        {/* Pitch section */}
        <div className="px-4 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-100">Pitch</h3>
            {!hasPitch && !isSent && !isNoEmail && (
              <button
                onClick={handleDraft}
                disabled={drafting}
                className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg bg-violet-600 active:bg-violet-700 text-white text-xs font-medium disabled:opacity-50"
              >
                {drafting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                {drafting ? 'Drafting…' : 'Draft with AI'}
              </button>
            )}
          </div>

          {isSent && (
            <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3">
              <p className="inline-flex items-center text-sm text-green-400 font-medium">
                <Check className="w-4 h-4 mr-1.5" />
                Sent
              </p>
            </div>
          )}

          {isNoEmail && !hasPitch && (
            <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3">
              <p className="text-sm text-yellow-400">No email available — reply on HN instead.</p>
            </div>
          )}

          {hasPitch && (
            <>
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400">Subject</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={isSent}
                  className="w-full h-11 rounded-lg bg-zinc-900 border border-zinc-800 px-3 text-sm text-zinc-100 font-mono focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400">Body</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={10}
                  disabled={isSent}
                  className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-zinc-100 font-mono resize-none focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Floating action bar */}
      {!isSent && (hasPitch || isNoEmail) && (
        <div
          className="fixed left-0 right-0 z-30 bg-zinc-950/95 backdrop-blur-lg border-t border-zinc-800 px-4 py-3 flex gap-2"
          style={{ bottom: 'calc(env(safe-area-inset-bottom) + 4rem)' }}
        >
          {isNoEmail ? (
            <a href={lead.url} target="_blank" rel="noopener noreferrer" className="flex-1">
              <button className="w-full h-11 inline-flex items-center justify-center gap-2 bg-yellow-600 active:bg-yellow-700 text-white rounded-xl font-medium text-sm">
                <ExternalLink className="w-4 h-4" />
                View on HN
              </button>
            </a>
          ) : (
            <button
              onClick={handleSend}
              disabled={sending || !subject || !body}
              className="flex-1 h-11 inline-flex items-center justify-center gap-2 bg-violet-600 active:bg-violet-700 text-white rounded-xl font-medium text-sm disabled:opacity-50"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {sending ? 'Sending…' : 'Send via Gmail'}
            </button>
          )}
          <button
            onClick={handleSkip}
            className="h-11 px-4 rounded-xl text-zinc-400 active:bg-zinc-900 font-medium text-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  )
}
