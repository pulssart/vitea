'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import Onboarding from '@/components/Onboarding'
import Dashboard from '@/components/Dashboard'

export default function Home() {
  const { hasCompletedOnboarding } = useAppStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-16 h-16 border-4 border-accent-pink border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return hasCompletedOnboarding ? <Dashboard /> : <Onboarding />
}


