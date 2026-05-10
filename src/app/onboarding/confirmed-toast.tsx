'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

export function ConfirmedToast() {
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
