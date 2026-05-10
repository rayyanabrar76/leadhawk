import { Newspaper, Target, Star, Flame, Clock, Sparkles } from 'lucide-react'

interface MockLead {
  badge: 'High' | 'Medium' | 'Low'
  freshness: 'fresh' | 'warm'
  title: string
  body: string
  author: string
  age: string
}

const MOCK_LEADS: MockLead[] = [
  {
    badge: 'High',
    freshness: 'fresh',
    title: 'Looking for a React dev to rebuild our admin dashboard',
    body: "We're a 12-person startup. Current dash is jQuery + Bootstrap. Need something modern…",
    author: 'sarahbuilds',
    age: '2h ago',
  },
  {
    badge: 'High',
    freshness: 'fresh',
    title: 'SEEKING FREELANCER | Remote | Next.js + Postgres',
    body: 'Building an internal tool for our ops team. Need someone for ~6 weeks. Strong TS preferred.',
    author: 'whoishiring',
    age: '4h ago',
  },
  {
    badge: 'Medium',
    freshness: 'warm',
    title: 'Need help shipping a v1 of an analytics product',
    body: 'Looking for a senior frontend who can move fast. Budget flexible for the right person.',
    author: 'morrisco',
    age: '11h ago',
  },
]

function MockBadge({ badge }: { badge: MockLead['badge'] }) {
  if (badge === 'High') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-500/15 text-violet-300 border border-violet-500/25">
        <Target className="w-3 h-3" />
        High
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/15 text-blue-300 border border-blue-500/25">
      <Star className="w-3 h-3" />
      Medium
    </span>
  )
}

export function HeroMockup() {
  return (
    <div className="relative">
      <div
        className="absolute -inset-8 bg-violet-500/20 blur-3xl rounded-full opacity-60 -z-10"
        aria-hidden="true"
      />
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 backdrop-blur-md shadow-2xl shadow-violet-500/10 overflow-hidden">
        <div className="border-b border-zinc-800 px-4 py-3 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
          </div>
          <div className="flex-1 text-center text-[10px] font-mono text-zinc-500">
            leadhawk.app/dashboard
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">Today</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-violet-500/15 text-violet-300 border border-violet-500/25">
              <Target className="w-3 h-3" />
              High intent only
            </span>
          </div>

          {MOCK_LEADS.map((lead, i) => (
            <div
              key={i}
              className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 hover:border-violet-500/40 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium text-white bg-amber-600">
                  <Newspaper className="w-3 h-3" />
                  HN
                </span>
                <MockBadge badge={lead.badge} />
                {lead.freshness === 'fresh' ? (
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-zinc-500" />
                )}
                <span className="text-[10px] text-zinc-500 ml-auto">{lead.age}</span>
              </div>
              <h4 className="text-xs font-medium text-zinc-100 mb-1 leading-snug">
                {lead.title}
              </h4>
              <p className="text-[11px] text-zinc-500 line-clamp-1">{lead.body}</p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800/60">
                <span className="text-[10px] text-zinc-500">by {lead.author}</span>
                <button className="inline-flex items-center gap-1 text-[10px] font-medium text-violet-300 bg-violet-500/15 px-2 py-0.5 rounded">
                  <Sparkles className="w-3 h-3" />
                  Draft pitch
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
