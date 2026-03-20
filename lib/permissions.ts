import { PLANS, Tier, PlanConfig } from './plans'

export interface UserSubscription {
  tier: Tier
  subscription_status: 'active' | 'past_due' | 'cancelled' | 'trialing'
  subscription_valid_until: string | null
}

export function getEffectiveTier(user: UserSubscription): Tier {
  if (user.tier === 'base') return 'base'
  if (user.subscription_status === 'cancelled') return 'base'
  if (user.subscription_valid_until) {
    if (new Date(user.subscription_valid_until) < new Date()) return 'base'
  }
  return user.tier
}

export function getPlan(user: UserSubscription): PlanConfig {
  return PLANS[getEffectiveTier(user)]
}

export function can(user: UserSubscription, feature: keyof PlanConfig): boolean {
  const value = getPlan(user)[feature]
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value > 0
  return false
}

export function canAddProperty(user: UserSubscription, currentCount: number): boolean {
  const max = getPlan(user).maxProperties
  if (max === -1) return true
  return currentCount < max
}

export function canAddMember(user: UserSubscription, currentCount: number): boolean {
  return currentCount < getPlan(user).maxUsers
}
