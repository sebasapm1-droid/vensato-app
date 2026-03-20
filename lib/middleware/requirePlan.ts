import { createClient } from '@/lib/supabase/server'
import { getPlan, getEffectiveTier } from '@/lib/permissions'
import { PlanConfig } from '@/lib/plans'
import { NextRequest, NextResponse } from 'next/server'

export function requireFeature(feature: keyof PlanConfig) {
  return async (req: NextRequest): Promise<NextResponse | null> => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('tier, subscription_status, subscription_valid_until')
      .eq('id', user.id)
      .single()

    if (!profile) return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })

    const plan = getPlan(profile)
    const value = plan[feature]
    const hasAccess = typeof value === 'boolean' ? value : (typeof value === 'number' ? value > 0 : false)

    if (!hasAccess) {
      return NextResponse.json({
        error: 'upgrade_required',
        message: 'Esta función requiere un plan superior',
        requiredFor: feature,
        currentTier: getEffectiveTier(profile),
      }, { status: 403 })
    }

    return null
  }
}
