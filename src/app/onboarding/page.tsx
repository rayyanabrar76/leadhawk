'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import { ProfileSetup } from '@/components/onboarding/profile-setup'

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
  return (
    <>
      <Toaster position="top-center" theme="dark" />
      <Suspense fallback={null}>
        <ConfirmedToastEffect />
      </Suspense>
      <ProfileSetup />
    </>
  )
}
