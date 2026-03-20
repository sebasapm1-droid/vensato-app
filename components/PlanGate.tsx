'use client'
import { usePlan } from '@/hooks/usePlan'
import { PlanConfig } from '@/lib/plans'

interface PlanGateProps {
  feature: keyof PlanConfig
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function PlanGate({ feature, children, fallback }: PlanGateProps) {
  const { can, isLoading } = usePlan()
  if (isLoading) return null
  if (!can(feature)) return fallback ? <>{fallback}</> : null
  return <>{children}</>
}
