import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { ServiceWorkerRegister } from '@/components/sw-register'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono' })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: 'LeadHawk - AI Sales Agent for Freelancers',
  description:
    'Wake up to booked meetings. LeadHawk monitors Hacker News for people who need your skill right now, drafts personalized pitches, and sends them from your Gmail.',
  applicationName: 'LeadHawk',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'LeadHawk',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/logo-icon.png',
  },
  openGraph: {
    title: 'LeadHawk - AI Sales Agent for Freelancers',
    description: 'Wake up to booked meetings.',
    images: ['/logo-full.png'],
    type: 'website',
    siteName: 'LeadHawk',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LeadHawk - AI Sales Agent for Freelancers',
    description: 'Wake up to booked meetings.',
    images: ['/logo-full.png'],
  },
}

export const viewport: Viewport = {
  themeColor: '#7c3aed',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} dark`} suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased font-sans">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  )
}
