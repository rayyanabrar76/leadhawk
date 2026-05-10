'use client'

import { useEffect, useState } from 'react'

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean
}

export function useMobileApp() {
  const [isMobileApp, setIsMobileApp] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as NavigatorWithStandalone).standalone === true

    const isMobileWidth = window.innerWidth < 768

    setIsStandalone(standalone)
    setIsMobileApp(standalone || isMobileWidth)

    const onResize = () => {
      const w = window.innerWidth < 768
      setIsMobileApp(standalone || w)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return { isMobileApp, isStandalone }
}
