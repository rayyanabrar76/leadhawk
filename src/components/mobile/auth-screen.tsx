'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/Logo'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Mail, Eye, EyeOff } from 'lucide-react'
import { InstallButton } from '@/components/mobile/install-button'

type Mode = 'login' | 'signup'

function GoogleGIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4818h4.8436c-.2086 1.125-.8431 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.8736 2.6836-6.6154z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.4673-.806 5.9564-2.1805l-2.9087-2.2581c-.8059.54-1.8368.8595-3.0477.8595-2.344 0-4.3282-1.5832-5.0359-3.7104H.9573v2.3318C2.4382 15.9832 5.4818 18 9 18z" fill="#34A853" />
      <path d="M3.9641 10.71c-.18-.54-.2823-1.1168-.2823-1.71 0-.5932.1023-1.17.2823-1.71V4.9582H.9573C.3477 6.1731 0 7.5477 0 9c0 1.4523.3477 2.8268.9573 4.0418L3.9641 10.71z" fill="#FBBC05" />
      <path d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.8918 11.4259 0 9 0 5.4818 0 2.4382 2.0168.9573 4.9582L3.9641 7.29C4.6718 5.1627 6.6559 3.5795 9 3.5795z" fill="#EA4335" />
    </svg>
  )
}

export function MobileAuthScreen({ defaultMode = 'login' }: { defaultMode?: Mode }) {
  const [mode, setMode] = useState<Mode>(defaultMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [checkEmailFor, setCheckEmailFor] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  function switchMode(next: Mode) {
    setMode(next)
    setError('')
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/app`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
    if (error) {
      setError(error.message)
      setGoogleLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/app&confirmed=true`,
        },
      })
      if (error) {
        const msg = error.message.toLowerCase()
        setError(msg.includes('already')
          ? 'An account with this email already exists. Switch to Log in.'
          : error.message)
        setLoading(false)
        return
      }
      const userExists = data?.user?.identities?.length === 0
      if (userExists) {
        setError('An account with this email already exists. Switch to Log in.')
        setLoading(false)
        return
      }
      setCheckEmailFor(email)
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      const msg = error.message.toLowerCase()
      setError(
        msg.includes('email not confirmed') ? 'Please confirm your email first. Check your inbox.'
        : msg.includes('invalid') ? 'Invalid email or password'
        : error.message
      )
      setLoading(false)
      return
    }
    router.replace('/app')
    router.refresh()
  }

  if (checkEmailFor) {
    return (
      <div className="fixed inset-0 flex flex-col bg-zinc-950 text-zinc-100">
        <div className="h-2/5 bg-gradient-to-br from-violet-600 via-violet-500 to-violet-700 flex items-center justify-center">
          <div className="rounded-full p-5 bg-white/10 backdrop-blur">
            <Mail className="w-12 h-12 text-white" />
          </div>
        </div>
        <div className="flex-1 bg-zinc-900 rounded-t-3xl -mt-6 px-6 pt-8 pb-10 flex flex-col items-center text-center">
          <h1 className="text-2xl font-bold text-zinc-50 mb-2">Check your email</h1>
          <p className="text-sm text-zinc-400 leading-relaxed mb-6 max-w-sm">
            We sent a confirmation link to{' '}
            <span className="text-white font-medium">{checkEmailFor}</span>. Click it to activate your account.
          </p>
          <button
            onClick={() => setCheckEmailFor(null)}
            className="mt-4 text-sm font-medium text-violet-400 hover:text-violet-300"
          >
            Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Top: violet hero */}
      <div className="h-[38vh] min-h-[220px] bg-gradient-to-br from-violet-600 via-violet-500 to-violet-700 flex items-center justify-center">
        <div className="rounded-3xl bg-white p-5 shadow-2xl ring-1 ring-white/40">
          <Logo variant="icon" size="lg" href={null} className="w-16 h-16" />
        </div>
      </div>

      {/* Bottom: auth card */}
      <div className="flex-1 bg-zinc-900 rounded-t-3xl -mt-6 px-6 pt-8 pb-10 overflow-y-auto">
        <h1 className="text-2xl font-bold text-zinc-50 mb-1">Welcome to LeadHawk</h1>
        <p className="text-sm text-zinc-400 mb-6">Wake up to booked meetings.</p>

        {/* Tabs */}
        <div className="flex bg-zinc-800/50 rounded-lg p-1 mb-5">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${
              mode === 'login' ? 'bg-zinc-950 text-white shadow-sm' : 'text-zinc-400'
            }`}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => switchMode('signup')}
            className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${
              mode === 'signup' ? 'bg-zinc-950 text-white shadow-sm' : 'text-zinc-400'
            }`}
          >
            Sign up
          </button>
        </div>

        {/* Google */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
          className="w-full h-12 flex items-center justify-center gap-2.5 bg-white text-zinc-900 active:bg-zinc-100 rounded-xl font-medium text-base transition-colors disabled:opacity-50 mb-4"
        >
          {googleLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <GoogleGIcon />}
          Continue with Google
        </button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-zinc-900 px-3 text-zinc-500">or</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            enterKeyHint="next"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full h-12 rounded-xl bg-zinc-800/60 border border-zinc-700 px-4 text-base text-zinc-100 placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-colors"
          />

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              enterKeyHint="go"
              placeholder={mode === 'signup' ? 'At least 8 characters' : 'Password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={mode === 'signup' ? 8 : undefined}
              className="w-full h-12 rounded-xl bg-zinc-800/60 border border-zinc-700 px-4 pr-12 text-base text-zinc-100 placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-zinc-500 active:bg-zinc-700"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {error && (
            <div className="rounded-lg bg-red-950/50 border border-red-900/50 p-3 text-sm text-red-400 animate-in fade-in slide-in-from-top-1">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full h-12 flex items-center justify-center gap-2 bg-violet-600 active:bg-violet-700 text-white rounded-xl font-semibold text-base transition-colors disabled:opacity-50"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            {loading
              ? (mode === 'login' ? 'Logging in…' : 'Creating account…')
              : (mode === 'login' ? 'Log in' : 'Create account')}
          </button>
        </form>

        <p className="text-sm text-zinc-400 text-center mt-6">
          {mode === 'login' ? (
            <>
              Don&apos;t have an account?{' '}
              <button onClick={() => switchMode('signup')} className="text-violet-400 font-medium">
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button onClick={() => switchMode('login')} className="text-violet-400 font-medium">
                Log in
              </button>
            </>
          )}
        </p>

        <div className="flex justify-center mt-6 pt-6 border-t border-zinc-800">
          <InstallButton variant="subtle" label="Install LeadHawk on your phone" />
        </div>
      </div>
    </div>
  )
}
