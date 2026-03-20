'use client'
import { useAppStore } from '@/lib/store/app-store'
import { getPlan, can, canAddProperty, canAddMember, getEffectiveTier } from '@/lib/permissions'
import { PlanConfig, Tier, PLANS } from '@/lib/plans'

export function usePlan() {
  const isLoading = useAppStore(s => s.isLoading)
  const profile = useAppStore(s => s.profileRaw)

  if (!profile || isLoading) {
    return {
      tier: 'base' as Tier,
      plan: PLANS['base'],
      isLoading: true,
      can: (_: keyof PlanConfig) => false,
      canAddProperty: (_: number) => false,
      canAddMember: (_: number) => false,
    }
  }

  return {
    tier: getEffectiveTier(profile as any),
    plan: getPlan(profile as any),
    subscriptionStatus: profile.subscription_status as string,
    subscriptionValidUntil: profile.subscription_valid_until as string | null,
    hasPaymentToken: !!profile.wompi_payment_token,
    pendingTier: profile.pending_tier as Tier | null,
    pendingTierSince: profile.pending_tier_since as string | null,
    isLoading: false,
    can: (feature: keyof PlanConfig) => can(profile as any, feature),
    canAddProperty: (count: number) => canAddProperty(profile as any, count),
    canAddMember: (count: number) => canAddMember(profile as any, count),
  }
}
