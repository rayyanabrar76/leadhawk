import { AlertTriangle } from 'lucide-react'
import { MarketingHeader } from '@/components/marketing/header'
import { MarketingFooter } from '@/components/marketing/footer'

export const metadata = {
  title: 'Terms of Service — LeadHawk',
  description: 'The terms governing your use of LeadHawk.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <MarketingHeader />

      <article className="max-w-3xl mx-auto px-6 py-20">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Last updated: 10 May 2026</p>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-50 mb-4">Terms of Service</h1>
        </div>

        <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4 mb-10">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-200/90 leading-relaxed">
              <strong className="font-semibold">Development template:</strong> These are template terms generated for development. Have a lawyer review them before launching publicly.
            </p>
          </div>
        </div>

        <div className="space-y-10">
          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">1. Acceptance of terms</h2>
            <p className="text-zinc-300 leading-relaxed">
              By creating an account or using LeadHawk, you agree to these Terms of Service and our <a href="/privacy" className="text-violet-400 hover:underline">Privacy Policy</a>. If you do not agree, do not use the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">2. Account responsibilities</h2>
            <p className="text-zinc-300 leading-relaxed">
              You are responsible for all activity under your account, including any emails sent via your connected Gmail. You agree to comply with the CAN-SPAM Act, GDPR (where applicable), and any other anti-spam laws governing your jurisdiction. You agree not to send unsolicited bulk email or use LeadHawk for spam.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">3. Acceptable use</h2>
            <p className="text-zinc-300 leading-relaxed mb-2">
              You agree not to:
            </p>
            <ul className="space-y-2 text-zinc-300 leading-relaxed list-disc list-inside">
              <li>Harass, defame, or threaten any individual via pitches sent through LeadHawk.</li>
              <li>Send illegal, harmful, or fraudulent content.</li>
              <li>Violate the Hacker News Terms of Service or rate-limit policies.</li>
              <li>Reverse-engineer, scrape, or attempt to bypass usage limits.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">4. Service availability</h2>
            <p className="text-zinc-300 leading-relaxed">
              LeadHawk is provided on a best-effort basis. We do not guarantee uptime SLAs on the Free tier. Paid tiers may have additional service commitments specified in your plan.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">5. Payments and refunds</h2>
            <p className="text-zinc-300 leading-relaxed">
              Pro and Agency tiers are billed monthly in advance. You can cancel at any time; cancellation takes effect at the end of the current billing period and prorated refunds are issued for unused full months. The Free tier has no payment obligation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">6. Intellectual property</h2>
            <p className="text-zinc-300 leading-relaxed">
              You retain ownership of any data you provide and any pitches drafted on your behalf. We retain ownership of the LeadHawk platform, including all software, branding, and underlying systems.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">7. Limitation of liability</h2>
            <p className="text-zinc-300 leading-relaxed">
              To the fullest extent permitted by law, LeadHawk&apos;s liability for any claim arising from these terms is capped at the greater of (a) the amount you paid us in the 12 months prior to the claim, or (b) US$100. We are not liable for indirect, incidental, or consequential damages.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">8. Termination</h2>
            <p className="text-zinc-300 leading-relaxed">
              We reserve the right to suspend or terminate your account for violations of these terms. You may terminate your account at any time from Settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">9. Governing law</h2>
            <p className="text-zinc-300 leading-relaxed">
              These terms are governed by the laws of [your jurisdiction]. Any disputes will be resolved in the courts of that jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">10. Contact</h2>
            <p className="text-zinc-300 leading-relaxed">
              Questions about these terms: <a href="mailto:legal@leadhawk.app" className="text-violet-400 hover:underline">legal@leadhawk.app</a>
            </p>
          </section>
        </div>
      </article>

      <MarketingFooter />
    </div>
  )
}
