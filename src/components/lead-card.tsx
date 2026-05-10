'use client'

import { useState } from 'react'
import { formatDistanceToNow } from '@/lib/time'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Target,
  Star,
  Circle,
  Flame,
  Clock,
  Calendar,
  Newspaper,
  Sparkles,
  X,
  Check,
  ExternalLink,
  Eye,
} from 'lucide-react'

export interface Lead {
  id: string
  source: 'reddit' | 'hackernews'
  title: string
  body: string
  url: string
  author: string
  posted_at: string
  created_at?: string
  freshness_score: number
  intent_priority?: number | null
  final_score?: number
  status: 'new' | 'drafted' | 'sent' | 'skipped' | 'no_email'
  pitches?: { subject: string; body: string; sent_at: string | null }[]
}

interface LeadCardProps {
  lead: Lead
  onSelect: (lead: Lead) => void
  onDraft: (leadId: string) => Promise<void>
  onSkip: (leadId: string) => Promise<void>
}

function FreshnessIcon({ score }: { score: number }) {
  if (score >= 76) return <Flame className="w-3.5 h-3.5 text-orange-400" />
  if (score >= 40) return <Clock className="w-3.5 h-3.5 text-muted-foreground" />
  return <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
}

function IntentBadge({ priority }: { priority: number }) {
  if (priority >= 80) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-500/15 text-violet-300 border border-violet-500/25">
        <Target className="w-3 h-3" />
        High
      </span>
    )
  }
  if (priority >= 50) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/15 text-blue-300 border border-blue-500/25">
        <Star className="w-3 h-3" />
        Medium
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted/40 text-muted-foreground border border-border">
      <Circle className="w-2.5 h-2.5" />
      Low
    </span>
  )
}

export function LeadCard({ lead, onSelect, onDraft, onSkip }: LeadCardProps) {
  const [loading, setLoading] = useState<'draft' | 'skip' | null>(null)

  async function handleDraft(e: React.MouseEvent) {
    e.stopPropagation()
    setLoading('draft')
    await onDraft(lead.id)
    setLoading(null)
  }

  async function handleSkip(e: React.MouseEvent) {
    e.stopPropagation()
    setLoading('skip')
    await onSkip(lead.id)
    setLoading(null)
  }

  const intent = lead.intent_priority ?? 0

  return (
    <div
      className="group border border-border rounded-lg p-4 cursor-pointer hover:border-violet-500/50 hover:bg-muted/30 transition-all"
      onClick={() => onSelect(lead)}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium text-white bg-amber-600">
              <Newspaper className="w-3 h-3" />
              HN
            </span>
            <IntentBadge priority={intent} />
            <FreshnessIcon score={lead.freshness_score} />
            <span className="font-mono text-xs text-muted-foreground">
              {lead.freshness_score}
            </span>
            <span className="text-xs text-muted-foreground ml-auto">
              {formatDistanceToNow(lead.posted_at)}
            </span>
          </div>

          <h3 className="text-sm font-medium text-foreground leading-snug line-clamp-2 mb-1">
            {lead.title}
          </h3>

          {lead.body && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {lead.body.slice(0, 200)}
            </p>
          )}

          <p className="text-xs text-muted-foreground mt-1.5">
            by <span className="text-foreground/70">{lead.author}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
        {lead.status === 'new' && (
          <>
            <Button
              size="sm"
              className="h-7 text-xs bg-violet-600 hover:bg-violet-700"
              onClick={handleDraft}
              disabled={loading !== null}
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              {loading === 'draft' ? 'Drafting…' : 'Draft pitch'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-muted-foreground"
              onClick={handleSkip}
              disabled={loading !== null}
            >
              <X className="w-3.5 h-3.5 mr-1" />
              Skip
            </Button>
          </>
        )}

        {lead.status === 'drafted' && (
          <>
            <Button
              size="sm"
              className="h-7 text-xs bg-violet-600 hover:bg-violet-700"
              onClick={(e) => { e.stopPropagation(); onSelect(lead) }}
            >
              <Eye className="w-3.5 h-3.5 mr-1.5" />
              View pitch + Send
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-muted-foreground"
              onClick={handleSkip}
              disabled={loading !== null}
            >
              <X className="w-3.5 h-3.5 mr-1" />
              Skip
            </Button>
          </>
        )}

        {lead.status === 'sent' && (
          <span className="inline-flex items-center text-xs text-green-500 font-medium">
            <Check className="w-3.5 h-3.5 mr-1" />
            Sent
          </span>
        )}

        {lead.status === 'skipped' && (
          <span className="text-xs text-muted-foreground">Skipped</span>
        )}

        {lead.status === 'no_email' && (
          <a
            href={lead.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center text-xs text-yellow-400 hover:text-yellow-300 underline-offset-2 hover:underline"
          >
            <ExternalLink className="w-3.5 h-3.5 mr-1" />
            View on HN
          </a>
        )}
      </div>
    </div>
  )
}

export function LeadCardSkeleton() {
  return (
    <div className="border border-border rounded-lg p-4 space-y-3">
      <div className="flex gap-2 items-center">
        <Skeleton className="h-5 w-10 rounded" />
        <Skeleton className="h-4 w-24 rounded" />
        <Skeleton className="h-4 w-16 rounded ml-auto" />
      </div>
      <Skeleton className="h-4 w-full rounded" />
      <Skeleton className="h-4 w-3/4 rounded" />
      <Skeleton className="h-3 w-1/3 rounded" />
    </div>
  )
}
