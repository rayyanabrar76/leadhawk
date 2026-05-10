import Link from 'next/link'
import { Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MarketingHeader } from '@/components/marketing/header'
import { MarketingFooter } from '@/components/marketing/footer'

const TIERS = [
  {
    name: 'Free',
    price: '$0',
    period: '/forever',
    desc: 'Get a feel for it.',
    features: [
      '10 leads per month',
      'AI pitch drafting',
      'Send via your Gmail',
      'Manual review of every send',
    ],
    cta: 'Start free',
    href: '/signup',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$19',
    period: '/month',
    desc: 'For solo freelancers.',
    features: [
      'Unlimited leads',
      'Auto-send mode',
      'Auto-booking on your calendar',
      'Reply handling',
      'Priority support',
    ],
    cta: 'Upgrade to Pro',
    href: '/signup',
    highlight: true,
  },
  {
    name: 'Agency',
    price: '$49',
    period: '/month',
    desc: 'For small teams.',
    features: [
      'Everything in Pro',
      '5 team members',
      'Shared lead pool',
      'Team analytics',
      'Custom domain support',
    ],
    cta: 'Upgrade to Agency',
    href: '/signup',
    highlight: false,
  },
]

const COMPARISON_ROWS = [
  { feature: 'Monthly leads', free: '10', pro: 'Unlimited', agency: 'Unlimited' },
  { feature: 'AI pitch drafting', free: true, pro: true, agency: true },
  { feature: 'Send via your Gmail', free: true, pro: true, agency: true },
  { feature: 'Auto-send mode', free: false, pro: true, agency: true },
  { feature: 'Auto-booking', free: false, pro: true, agency: true },
  { feature: 'Reply handling', free: false, pro: true, agency: true },
  { feature: 'Team members', free: '1', pro: '1', agency: '5' },
  { feature: 'Shared lead pool', free: false, pro: false, agency: true },
  { feature: 'Team analytics', free: false, pro: false, agency: true },
  { feature: 'Custom domain', free: false, pro: false, agency: true },
  { feature: 'Priority support', free: false, pro: true, agency: true },
]

function CellValue({ value }: { value: string | boolean }) {
  if (typeof value === 'boolean') {
    return value
      ? <Check className="w-4 h-4 text-violet-400 mx-auto" />
      : <X className="w-4 h-4 text-zinc-700 mx-auto" />
  }
  return <span className="text-sm text-zinc-300">{value}</span>
}

export const metadata = {
  title: 'Pricing — LeadHawk',
  description: 'Simple pricing for freelancers and agencies. Start free, upgrade when leads turn into revenue.',
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <MarketingHeader />

      <section>
        <div className="max-w-6xl mx-auto px-6 py-20 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-50 mb-4">
            Simple pricing
          </h1>
          <p className="text-lg text-zinc-400 max-w-xl mx-auto">
            Free forever to try. Upgrade when leads turn into revenue.
          </p>
        </div>
      </section>

      <section>
        <div className="max-w-6xl mx-auto px-6 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {TIERS.map((tier) => (
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
                      <Check className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href={tier.href}>
                  <Button
                    className={`w-full ${
                      tier.highlight
                        ? 'bg-violet-600 hover:bg-violet-700'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100'
                    }`}
                  >
                    {tier.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="max-w-5xl mx-auto px-6 pb-24">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-50 mb-8 text-center">
            Compare plans
          </h2>

          <div className="overflow-x-auto rounded-xl border border-zinc-800/60">
            <table className="w-full">
              <thead className="bg-zinc-900/50 border-b border-zinc-800/60">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Feature
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-400 text-center">
                    Free
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-violet-300 text-center">
                    Pro
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-400 text-center">
                    Agency
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.feature} className="hover:bg-zinc-900/30 transition-colors">
                    <td className="px-6 py-3.5 text-sm text-zinc-200">{row.feature}</td>
                    <td className="px-6 py-3.5 text-center"><CellValue value={row.free} /></td>
                    <td className="px-6 py-3.5 text-center bg-violet-500/[0.02]"><CellValue value={row.pro} /></td>
                    <td className="px-6 py-3.5 text-center"><CellValue value={row.agency} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}
