'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { Logo } from '@/components/Logo'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Mail, X, Eye, EyeOff } from 'lucide-react'

type Mode = 'login' | 'signup'

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultMode?: Mode
}

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
      <path
        d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4818h4.8436c-.2086 1.125-.8431 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.8736 2.6836-6.6154z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.4673-.806 5.9564-2.1805l-2.9087-2.2581c-.8059.54-1.8368.8595-3.0477.8595-2.344 0-4.3282-1.5832-5.0359-3.7104H.9573v2.3318C2.4382 15.9832 5.4818 18 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.9641 10.71c-.18-.54-.2823-1.1168-.2823-1.71 0-.5932.1023-1.17.2823-1.71V4.9582H.9573C.3477 6.1731 0 7.5477 0 9c0 1.4523.3477 2.8268.9573 4.0418L3.9641 10.71z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.8918 11.4259 0 9 0 5.4818 0 2.4382 2.0168.9573 4.9582L3.9641 7.29C4.6718 5.1627 6.6559 3.5795 9 3.5795z"
        fill="#EA4335"
      />
    </svg>
  )
}

export function AuthModal({ open, onOpenChange, defaultMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<Mode>(defaultMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [checkEmailFor, setCheckEmailFor] = useState<string | null>(null)
  const [resending, setResending] = useState(false)
  const [resentMsg, setResentMsg] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (open) {
      setMode(defaultMode)
      setError('')
      setCheckEmailFor(null)
      setResentMsg('')
      setShowPassword(false)
    }
  }, [open, defaultMode])

  function switchMode(next: Mode) {
    setMode(next)
    setError('')
    setResentMsg('')
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
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
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding&confirmed=true`,
        },
      })

      if (error) {
        const msg = error.message.toLowerCase()
        if (msg.includes('already')) {
          setError('An account with this email already exists. Switch to Log in.')
        } else {
          setError(error.message)
        }
        setLoading(false)
        return
      }

      // Supabase returns success with empty identities[] when the email is already taken
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
      if (msg.includes('email not confirmed')) {
        setError('Please confirm your email first. Check your inbox.')
      } else if (msg.includes('invalid')) {
        setError('Invalid email or password')
      } else {
        setError(error.message)
      }
      setLoading(false)
      return
    }

    onOpenChange(false)
    router.push('/dashboard')
    router.refresh()
  }

  async function handleResend() {
    if (!checkEmailFor) return
    setResending(true)
    setResentMsg('')
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: checkEmailFor,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding&confirmed=true`,
      },
    })
    setResending(false)
    if (error) setError(error.message)
    else setResentMsg('Confirmation email resent.')
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
        />
        <DialogPrimitive.Popup
          className="fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100vw-2rem)] sm:max-w-110 -translate-x-1/2 -translate-y-1/2 max-h-[calc(100vh-2rem)] overflow-y-auto gap-4 border border-zinc-800 bg-zinc-900 p-5 sm:p-6 shadow-2xl rounded-2xl ring-1 ring-white/5 duration-200 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
        >
          <DialogPrimitive.Close
            className="absolute top-4 right-4 rounded-md p-1 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </DialogPrimitive.Close>

          {checkEmailFor ? (
            <>
              <DialogPrimitive.Title className="sr-only">Check your email</DialogPrimitive.Title>
              <DialogPrimitive.Description className="sr-only">
                We sent a confirmation link to {checkEmailFor}.
              </DialogPrimitive.Description>

              <div className="flex flex-col items-center text-center pt-2 animate-in fade-in slide-in-from-bottom-1 duration-300">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-violet-500/10 mb-5">
                  <Mail className="w-8 h-8 text-violet-400" />
                </div>
                <h3 className="text-xl font-semibold text-zinc-50 mb-2">Check your email</h3>
                <p className="text-sm text-zinc-400 leading-relaxed mb-6 max-w-xs">
                  We sent a confirmation link to{' '}
                  <span className="text-white font-medium">{checkEmailFor}</span>. Click it to activate your account.
                </p>
                <p className="text-xs text-zinc-500">
                  Didn&apos;t get it?{' '}
                  <button
                    onClick={handleResend}
                    disabled={resending}
                    className="text-violet-400 hover:text-violet-300 font-medium underline-offset-4 hover:underline disabled:opacity-50"
                  >
                    {resending ? 'Resending…' : 'Resend'}
                  </button>
                </p>
                {resentMsg && (
                  <p className="text-xs text-green-400 mt-3 animate-in fade-in">{resentMsg}</p>
                )}
                {error && (
                  <p className="text-xs text-red-400 mt-3 animate-in fade-in">{error}</p>
                )}

                <button
                  onClick={() => onOpenChange(false)}
                  className="mt-6 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Header */}
              <div className="flex flex-col items-center gap-1.5">
                <Logo variant="icon" size="md" href={null} />
                <DialogPrimitive.Title className="text-xl font-semibold tracking-tight text-zinc-50 text-center">
                  Welcome to LeadHawk
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="text-xs text-zinc-400 text-center">
                  Wake up to booked meetings.
                </DialogPrimitive.Description>
              </div>

              {/* Tabs */}
              <div className="flex bg-zinc-800/50 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                    mode === 'login'
                      ? 'bg-zinc-950 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Log in
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                    mode === 'signup'
                      ? 'bg-zinc-950 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
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
                className="inline-flex items-center justify-center gap-2.5 w-full h-11 bg-white text-zinc-900 hover:bg-zinc-100 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
              >
                {googleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <GoogleGIcon />
                )}
                Continue with Google
              </button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-zinc-900 px-2 text-zinc-500">or</span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <label htmlFor="auth-email" className="text-xs font-medium text-zinc-300">
                    Email
                  </label>
                  <input
                    id="auth-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex w-full h-11 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="auth-password" className="text-xs font-medium text-zinc-300">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="auth-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={mode === 'signup' ? 8 : undefined}
                      className="flex w-full h-11 rounded-lg border border-zinc-800 bg-zinc-950 px-3 pr-10 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="rounded-md bg-red-950/50 border border-red-900/50 p-3 text-sm text-red-400 animate-in fade-in slide-in-from-top-1 duration-200">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || googleLoading}
                  className="inline-flex items-center justify-center gap-2 w-full h-11 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading
                    ? (mode === 'login' ? 'Logging in…' : 'Creating account…')
                    : (mode === 'login' ? 'Log in' : 'Create account')}
                </button>
              </form>

              {/* Footer toggle */}
              <p className="text-sm text-zinc-400 text-center">
                {mode === 'login' ? (
                  <>
                    Don&apos;t have an account?{' '}
                    <button
                      onClick={() => switchMode('signup')}
                      className="text-violet-400 hover:text-violet-300 font-medium underline-offset-4 hover:underline"
                    >
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button
                      onClick={() => switchMode('login')}
                      className="text-violet-400 hover:text-violet-300 font-medium underline-offset-4 hover:underline"
                    >
                      Log in
                    </button>
                  </>
                )}
              </p>
            </>
          )}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
