'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getPlan, can, canAddProperty, canAddMember, getEffectiveTier } from '@/lib/permissions'
import { PlanConfig, Tier, PLANS } from '@/lib/plans'

export function usePlan() {
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setIsLoading(false); return }
      supabase
        .from('profiles')
        .select('tier, subscription_status, subscription_valid_until')
        .eq('id', user.id)
        .single()
        .then(({ data }) => { setProfile(data); setIsLoading(false) })
    })
  }, [])

  if (!profile || isLoading) {
    return {
      tier: 'base' as Tier,
      plan: PLANS['base'],
      isLoading,
      can: (_: keyof PlanConfig) => false,
      canAddProperty: (_: number) => false,
      canAddMember: (_: number) => false,
    }
  }

  return {
    tier: getEffectiveTier(profile),
    plan: getPlan(profile),
    isLoading: false,
    can: (feature: keyof PlanConfig) => can(profile, feature),
    canAddProperty: (count: number) => canAddProperty(profile, count),
    canAddMember: (count: number) => canAddMember(profile, count),
  }
}
