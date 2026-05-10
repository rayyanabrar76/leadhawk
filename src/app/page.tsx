'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Target,
  Brain,
  Search,
  Mail,
  Calendar,
  Flame,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  ArrowDown,
  Newspaper,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MarketingHeader } from '@/components/marketing/header'
import { MarketingFooter } from '@/components/marketing/footer'
import { FaqAccordion } from '@/components/marketing/faq-accordion'
import { HeroMockup } from '@/components/marketing/hero-mockup'
import { AuthModal } from '@/components/auth/AuthModal'

const HOW_IT_WORKS = [
  { icon: Brain, title: 'Tell us your skill', desc: 'Connect Gmail in one click and describe what you do. Takes 30 seconds.' },
  { icon: Search, title: 'AI finds fresh leads', desc: 'We scan Hacker News every few minutes for people actively asking for your skill.' },
  { icon: Mail, title: 'AI drafts and sends', desc: 'Personalized cold emails go out from your Gmail, in your voice.' },
  { icon: Calendar, title: 'Meetings book themselves', desc: 'When prospects reply, AI handles the back-and-forth and books the call on your calendar.' },
]

const FEATURES = [
  { icon: Flame, title: 'Real-time lead detection', desc: 'Posts under 24 hours old only. Freshness matters — older leads are already lost.' },
  { icon: Target, title: 'Intent filtering', desc: 'AI ignores rants and questions. You only see people actually trying to hire.' },
  { icon: Sparkles, title: 'Personalized pitches', desc: "Every email references something specific from the prospect's post. No templates." },
  { icon: Mail, title: 'Sends from your Gmail', desc: 'Your domain, your reputation. We never send from our servers.' },
  { icon: Calendar, title: 'Auto-booking', desc: 'When someone says yes, the call is on your calendar before you read the reply.' },
  { icon: ShieldCheck, title: 'You stay in control', desc: 'Review or auto-send. Pause anytime. Edit any pitch before it goes out.' },
]

const PRICING_TIERS = [
  {
    name: 'Free', price: '$0', period: '/forever', desc: 'Get a feel for it.',
    features: ['10 leads per month', 'AI pitch drafting', 'Send via your Gmail', 'Manual review of every send'],
    cta: 'Start free', highlight: false,
  },
  {
    name: 'Pro', price: '$19', period: '/month', desc: 'For solo freelancers.',
    features: ['Unlimited leads', 'Auto-send mode', 'Auto-booking on your calendar', 'Reply handling', 'Priority support'],
    cta: 'Upgrade', highlight: true,
  },
  {
    name: 'Agency', price: '$49', period: '/month', desc: 'For small teams.',
    features: ['Everything in Pro', '5 team members', 'Shared lead pool', 'Team analytics', 'Custom domain support'],
    cta: 'Upgrade', highlight: false,
  },
]

const FAQ = [
  { q: 'Is this allowed by Hacker News?', a: "Yes, we use HN's public Algolia search API. We respect rate limits and never send messages on HN itself — pitches go via your own Gmail." },
  { q: 'Will my emails be marked as spam?', a: 'Pitches are personalized and sent from your own Gmail in low volume, which keeps deliverability high. We also include unsubscribe links by default.' },
  { q: 'What about Reddit?', a: "Reddit's API now requires a paid commercial agreement for SaaS. We're working on it. For now, HN is the lead source." },
  { q: 'Is my Gmail data safe?', a: 'We only request gmail.send and gmail.readonly scopes. We never store the contents of your emails — we only watch for new replies to threads we sent.' },
  { q: 'Can I cancel anytime?', a: 'Yes. One click in settings, no questions asked.' },
]

function AuthQueryEffect({ onOpenAuth }: { onOpenAuth: (mode: 'login' | 'signup') => void }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const param = searchParams.get('auth')
    if (param === 'login' || param === 'signup') {
      onOpenAuth(param)
      router.replace('/')
    }
  }, [searchParams, router, onOpenAuth])

  return null
}

export default function LandingPage() {
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup')

  const openAuth = useCallback((mode: 'login' | 'signup') => {
    setAuthMode(mode)
    setAuthOpen(true)
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Suspense fallback={null}>
        <AuthQueryEffect onOpenAuth={openAuth} />
      </Suspense>
      <MarketingHeader onOpenAuth={openAuth} />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 pt-10 pb-20 md:pt-14 md:pb-24">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="lh-fade-in">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-violet-500/10 text-violet-300 border border-violet-500/20 mb-6">
                <Target className="w-3.5 h-3.5" />
                AI Sales Agent for Freelancers
              </span>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.05] text-zinc-50 mb-6">
                Wake up to <span className="text-violet-400">booked meetings.</span>
              </h1>
              <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-8 leading-relaxed">
                LeadHawk monitors Hacker News for people who need your skill right now. AI drafts personalized pitches and sends them from your Gmail. You just show up to the calls.
              </p>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <Button
                  size="lg"
                  className="bg-violet-600 hover:bg-violet-700 text-white text-base px-6 h-12 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                  onClick={() => openAuth('signup')}
                >
                  Start free — 10 leads/month
                </Button>
                <a href="#how-it-works">
                  <Button
                    size="lg"
                    variant="ghost"
                    className="text-zinc-300 hover:text-zinc-50 hover:bg-zinc-900 text-base px-5 h-12"
                  >
                    See how it works
                    <ArrowDown className="w-4 h-4 ml-2" />
                  </Button>
                </a>
              </div>
              <p className="text-xs text-zinc-500">
                No credit card required · Connect Gmail in 30 seconds
              </p>
            </div>

            <div className="hidden lg:block lh-fade-in lh-fade-in-delay">
              <HeroMockup />
            </div>
          </div>
        </div>

        <div
          className="absolute top-32 left-1/2 -translate-x-1/2 w-150 h-100 bg-violet-500/10 blur-[120px] rounded-full -z-10 pointer-events-none"
          aria-hidden="true"
        />
      </section>

      {/* SOCIAL PROOF */}
      <section className="border-y border-zinc-800/60 bg-zinc-950">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12">
          <p className="text-xs uppercase tracking-wider text-zinc-500">Lead sources we monitor</p>
          <div className="flex items-center gap-2 text-zinc-400">
            <Newspaper className="w-4 h-4" />
            <span className="text-sm font-medium">Hacker News</span>
          </div>
          <p className="text-xs text-zinc-600">Reddit coming soon</p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="scroll-mt-20">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-50 mb-4">
              From skill to booked meeting in 4 steps
            </h2>
            <p className="text-base text-zinc-400 max-w-xl mx-auto">
              Set it up once, then let it run while you focus on the work.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((step, i) => {
              const Icon = step.icon
              return (
                <div key={i} className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-6 hover:border-violet-500/40 transition-colors">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-violet-500/15 border border-violet-500/30 mb-4">
                    <span className="font-mono text-xs font-semibold text-violet-300">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <Icon className="w-6 h-6 text-violet-400 mb-3" />
                  <h3 className="text-base font-semibold text-zinc-100 mb-2">{step.title}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">{step.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="scroll-mt-20 bg-zinc-950">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-50 mb-4">
              Everything you need to land clients on autopilot
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feat, i) => {
              const Icon = feat.icon
              return (
                <div key={i} className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-6 hover:border-violet-500/40 transition-colors">
                  <Icon className="w-6 h-6 text-violet-400 mb-4" />
                  <h3 className="text-base font-semibold text-zinc-100 mb-2">{feat.title}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">{feat.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* PRICING TEASER */}
      <section id="pricing-teaser">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-50 mb-4">
              Simple pricing
            </h2>
            <p className="text-base text-zinc-400">Free forever to try. Upgrade when leads turn into revenue.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {PRICING_TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-xl p-6 flex flex-col ${
                  tier.highlight
                    ? 'border-2 border-violet-500 bg-violet-500/5 ring-1 ring-violet-500/30 relative'
                    : 'border border-zinc-800/60 bg-zinc-900/30'
                }`}
              >
                {tier.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-violet-600 text-white">
                    Most popular
                  </span>
                )}
                <h3 className="text-xl font-semibold text-zinc-100 mb-1">{tier.name}</h3>
                <p className="text-sm text-zinc-500 mb-4">{tier.desc}</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold tracking-tight text-zinc-50 font-mono">{tier.price}</span>
                  <span className="text-sm text-zinc-500">{tier.period}</span>
                </div>
                <ul className="space-y-2 mb-6 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-zinc-300">
                      <Check className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full ${
                    tier.highlight
                      ? 'bg-violet-600 hover:bg-violet-700'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100'
                  }`}
                  onClick={() => openAuth('signup')}
                >
                  {tier.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq">
        <div className="max-w-3xl mx-auto px-6 py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-50 mb-4">
              Frequently asked
            </h2>
          </div>
          <FaqAccordion items={FAQ} />
        </div>
      </section>

      {/* FINAL CTA */}
      <section>
        <div className="max-w-4xl mx-auto px-6 py-24 text-center">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-50 mb-4">
            Stop chasing leads. <span className="text-violet-400">Start meeting them.</span>
          </h2>
          <p className="text-base md:text-lg text-zinc-400 mb-8">
            Join freelancers who wake up to booked calls.
          </p>
          <Button
            size="lg"
            className="bg-violet-600 hover:bg-violet-700 text-white text-base px-7 h-12 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
            onClick={() => openAuth('signup')}
          >
            Get started free
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </section>

      <MarketingFooter />

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} defaultMode={authMode} />
    </div>
  )
}
