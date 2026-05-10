'use client'

import { useState, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { type Lead, isJobBoardSource, sourceBadge, viewLinkLabel } from '@/components/lead-card'
import { formatDistanceToNow } from '@/lib/time'
import {
  Newspaper,
  ExternalLink,
  Sparkles,
  Send,
  X,
  Check,
  Briefcase,
  Code2,
} from 'lucide-react'

interface LeadDrawerProps {
  lead: Lead | null
  open: boolean
  onClose: () => void
  onDraft: (leadId: string) => Promise<void>
  onSend: (leadId: string, subject: string, body: string) => Promise<void>
  onSkip: (leadId: string) => Promise<void>
}

export function LeadDrawer({ lead, open, onClose, onDraft, onSend, onSkip }: LeadDrawerProps) {
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [drafting, setDrafting] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')

  useEffect(() => {
    if (lead?.pitches?.[0]) {
      setSubject(lead.pitches[0].subject)
      setBody(lead.pitches[0].body)
    } else {
      setSubject('')
      setBody('')
    }
    setSendError('')
  }, [lead])

  if (!lead) return null

  const hasPitch = Boolean(lead.pitches?.[0])
  const isSent = lead.status === 'sent'
  const isNoEmail = lead.status === 'no_email'
  const isJobBoard = isJobBoardSource(lead.source)
  const isGitHub = lead.source === 'github_bounties'
  const badge = sourceBadge(lead.source)
  const SourceIcon = isJobBoard ? Briefcase : isGitHub ? Code2 : Newspaper

  async function handleDraft() {
    if (!lead) return
    setDrafting(true)
    await onDraft(lead.id)
    setDrafting(false)
  }

  async function handleSend() {
    if (!lead) return
    setSending(true)
    setSendError('')
    try {
      await onSend(lead.id, subject, body)
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Failed to send')
    }
    setSending(false)
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col h-full p-0">
        {/* Fixed header */}
        <SheetHeader className="p-5 sm:p-6 pb-4 shrink-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${badge.cls}`}>
              <SourceIcon className="w-3 h-3" />
              {badge.label}
            </span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground font-mono">{formatDistanceToNow(lead.posted_at)}</span>
            <span className="text-xs text-muted-foreground">
              {isJobBoard && lead.company_name ? lead.company_name : `by ${lead.author}`}
            </span>
            {lead.salary && (
              <span className="text-xs text-zinc-400">· {lead.salary}</span>
            )}
          </div>
          <SheetTitle className="text-base leading-snug text-left">{lead.title}</SheetTitle>
          <a
            href={lead.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-xs text-violet-400 hover:underline mt-1"
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            View original post
          </a>
        </SheetHeader>

        <Separator className="shrink-0" />

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
        {lead.body && (
          <div className="px-5 sm:px-6 py-4">
            <p className="text-xs text-muted-foreground whitespace-pre-wrap">
              {lead.body}
            </p>
          </div>
        )}

        <Separator />

        <div className="px-6 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">{isJobBoard ? 'Job posting' : 'Pitch'}</h3>
            {!hasPitch && !isSent && !isJobBoard && (
              <Button
                size="sm"
                className="h-7 text-xs bg-violet-600 hover:bg-violet-700"
                onClick={handleDraft}
                disabled={drafting}
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                {drafting ? 'Drafting with AI…' : 'Draft with AI'}
              </Button>
            )}
          </div>

          {isSent && (
            <div className="rounded-md bg-green-500/10 border border-green-500/20 px-3 py-2">
              <p className="inline-flex items-center text-xs text-green-400 font-medium">
                <Check className="w-3.5 h-3.5 mr-1" />
                Sent
              </p>
            </div>
          )}

          {isNoEmail && !hasPitch && (
            <div className="rounded-md bg-yellow-500/10 border border-yellow-500/20 px-3 py-2 space-y-2">
              <p className="text-xs text-yellow-400">No email address found for this author.</p>
              <p className="text-xs text-muted-foreground">You can still view the post on HN and reply there directly.</p>
            </div>
          )}

          {hasPitch && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Subject</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="text-sm font-mono"
                  disabled={isSent}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Body</Label>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={10}
                  className="text-sm font-mono resize-none"
                  disabled={isSent}
                />
              </div>
            </div>
          )}

          {sendError && (
            <p className="text-xs text-red-400">{sendError}</p>
          )}
        </div>
        </div>{/* end scrollable */}

        {/* Fixed action bar */}
        {!isSent && (hasPitch || isNoEmail || isJobBoard) && (
          <div className="px-5 sm:px-6 py-4 border-t border-border flex gap-2 shrink-0">
            {isJobBoard && lead.apply_url ? (
              <a
                href={lead.apply_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button className="w-full bg-violet-600 hover:bg-violet-700">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Apply on site
                </Button>
              </a>
            ) : isNoEmail ? (
              <a
                href={lead.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button className="w-full bg-yellow-600 hover:bg-yellow-700">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  {viewLinkLabel(lead.source)}
                </Button>
              </a>
            ) : (
              <Button
                className="flex-1 bg-violet-600 hover:bg-violet-700"
                onClick={handleSend}
                disabled={sending || !subject || !body}
              >
                <Send className="w-4 h-4 mr-2" />
                {sending ? 'Sending…' : 'Send via Gmail'}
              </Button>
            )}
            <Button
              variant="ghost"
              className="text-muted-foreground"
              onClick={() => { onSkip(lead.id); onClose() }}
            >
              <X className="w-4 h-4 mr-1" />
              Skip
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
