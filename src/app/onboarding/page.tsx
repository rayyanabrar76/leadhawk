'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowRight } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'

function ConfirmedToastEffect() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get('confirmed') === 'true') {
      toast.success('Email confirmed — Welcome to LeadHawk', { duration: 4000 })
      router.replace('/onboarding')
    }
  }, [searchParams, router])

  return null
}

export default function OnboardingPage() {
  const [skill, setSkill] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!skill.trim()) return

    setError('')
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/?auth=login')
      return
    }

    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, email: user.email!, skill: skill.trim() })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Toaster position="top-center" theme="dark" />
      <Suspense fallback={null}>
        <ConfirmedToastEffect />
      </Suspense>
      <div className="w-full max-w-lg space-y-8">
        <div className="flex flex-col items-center text-center">
          <Logo variant="full" size="md" href="/" />
          <p className="mt-4 text-muted-foreground">
            What&apos;s your skill? We&apos;ll hunt leads that match it.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="skill">Your skill / service</Label>
            <Input
              id="skill"
              type="text"
              placeholder="e.g. React developer specializing in dashboards"
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              required
              className="text-base"
            />
            <p className="text-xs text-muted-foreground">
              Be specific — this is used to search for matching posts and write your pitches.
            </p>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button
            type="submit"
            className="w-full bg-violet-600 hover:bg-violet-700"
            disabled={loading || !skill.trim()}
          >
            {loading ? 'Saving…' : (
              <span className="inline-flex items-center">
                Start finding leads
                <ArrowRight className="w-4 h-4 ml-2" />
              </span>
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
