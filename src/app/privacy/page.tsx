import { AlertTriangle } from 'lucide-react'
import { MarketingHeader } from '@/components/marketing/header'
import { MarketingFooter } from '@/components/marketing/footer'

export const metadata = {
  title: 'Privacy Policy — LeadHawk',
  description: 'How LeadHawk collects, uses, and protects your data.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <MarketingHeader />

      <article className="max-w-3xl mx-auto px-6 py-20">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Last updated: 10 May 2026</p>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-50 mb-4">Privacy Policy</h1>
        </div>

        <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4 mb-10">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-200/90 leading-relaxed">
              <strong className="font-semibold">Development template:</strong> This is a template privacy policy generated for development. Before launching publicly, have a lawyer review it or use a service like Termly or iubenda to ensure compliance with GDPR, CCPA, and your jurisdiction&apos;s laws.
            </p>
          </div>
        </div>

        <div className="prose prose-invert prose-sm max-w-none space-y-10">
          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">1. What we collect</h2>
            <ul className="space-y-2 text-zinc-300 leading-relaxed list-disc list-inside">
              <li><strong>Account info:</strong> email address and password hash you provide at signup.</li>
              <li><strong>OAuth tokens:</strong> Google access and refresh tokens, stored encrypted, used solely to send email and read replies on your behalf.</li>
              <li><strong>Lead data:</strong> public posts we discover on Hacker News on your behalf, plus the pitches drafted from them.</li>
              <li><strong>Usage analytics:</strong> page views, feature usage (anonymized), and error logs to improve the product.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">2. How we use it</h2>
            <p className="text-zinc-300 leading-relaxed">
              Your data is used to provide the LeadHawk service, improve the product, and comply with legal obligations. We never sell your data to third parties. We never read the contents of emails you receive in your Gmail inbox beyond replies on threads we sent on your behalf.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">3. Third parties</h2>
            <p className="text-zinc-300 leading-relaxed mb-3">
              We use the following processors:
            </p>
            <ul className="space-y-2 text-zinc-300 leading-relaxed list-disc list-inside">
              <li><strong>Supabase</strong> — database and authentication. (<a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline">Privacy policy</a>)</li>
              <li><strong>Google</strong> — OAuth, Gmail send/read, Calendar booking. (<a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline">Privacy policy</a>)</li>
              <li><strong>Google Gemini</strong> — AI processing for keyword expansion, intent classification, and pitch drafting. (<a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline">API terms</a>)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">4. Data retention</h2>
            <p className="text-zinc-300 leading-relaxed">
              Account data is kept while your account is active. If you delete your account, we delete all associated data within 30 days, except where retention is legally required (e.g. tax records).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">5. Your rights</h2>
            <p className="text-zinc-300 leading-relaxed">
              You can access, export, or delete your data at any time. Email <a href="mailto:privacy@leadhawk.app" className="text-violet-400 hover:underline">privacy@leadhawk.app</a> for any request, and we will respond within 30 days. Depending on your jurisdiction, you may have additional rights (e.g. GDPR, CCPA) — these are honored.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">6. Cookies</h2>
            <p className="text-zinc-300 leading-relaxed">
              We use only essential authentication cookies. We do not use tracking cookies, advertising cookies, or third-party analytics cookies that follow you across sites.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">7. Updates</h2>
            <p className="text-zinc-300 leading-relaxed">
              We may update this policy. Material changes will be communicated by email to your account address at least 14 days before they take effect.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-100 mb-3">8. Contact</h2>
            <p className="text-zinc-300 leading-relaxed">
              Privacy questions: <a href="mailto:privacy@leadhawk.app" className="text-violet-400 hover:underline">privacy@leadhawk.app</a>
            </p>
          </section>
        </div>
      </article>

      <MarketingFooter />
    </div>
  )
}
