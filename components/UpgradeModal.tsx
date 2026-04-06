'use client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { PlanConfig, Tier } from '@/lib/plans'

export const FEATURE_LABELS: Partial<Record<keyof PlanConfig, string>> = {
  hasAgent: 'Asistente Vensato',
  hasChargeEmailManual: 'Envio manual de cuentas de cobro',
  hasChargeEmailAutomatic: 'Envio automatico de cuentas de cobro',
  hasWompiCobros: 'Cobros automaticos a inquilinos',
  hasBovedaDocs: 'Boveda de documentos',
  hasNOI: 'Tableros de rentabilidad y NOI',
  hasReportesAvanzados: 'Reportes financieros avanzados',
  hasEmailRecordatorios: 'Recordatorios automaticos por email',
  hasWhatsappRecordatorios: 'Recordatorios por WhatsApp',
  hasDIAN: 'Facturacion electronica DIAN',
  hasCopropiedad: 'Division de copropiedad',
  hasExportacionContable: 'Exportacion contable avanzada',
  hasMultiUsuario: 'Usuarios adicionales en el workspace',
  maxProperties: 'Mas propiedades en tu portafolio',
}

export const FEATURE_REQUIRED_TIER: Partial<Record<keyof PlanConfig, Tier>> = {
  hasAgent: 'inicio',
  hasChargeEmailManual: 'inicio',
  hasChargeEmailAutomatic: 'portafolio',
  hasWompiCobros: 'inicio',
  hasBovedaDocs: 'inicio',
  hasNOI: 'portafolio',
  hasReportesAvanzados: 'portafolio',
  hasEmailRecordatorios: 'portafolio',
  hasWhatsappRecordatorios: 'patrimonio',
  hasDIAN: 'patrimonio',
  hasCopropiedad: 'patrimonio',
  hasExportacionContable: 'patrimonio',
  hasMultiUsuario: 'patrimonio',
  maxProperties: 'inicio',
}

const TIER_NAMES: Record<Tier, string> = {
  base: 'Base',
  inicio: 'Inicio',
  portafolio: 'Portafolio',
  patrimonio: 'Patrimonio',
}

interface UpgradeModalProps {
  feature: keyof PlanConfig
  onClose: () => void
}

export function UpgradeModal({ feature, onClose }: UpgradeModalProps) {
  const router = useRouter()
  const label = FEATURE_LABELS[feature] ?? 'esta funcion'
  const requiredTier = FEATURE_REQUIRED_TIER[feature]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-vensato-surface border border-vensato-border-subtle rounded-2xl p-8 max-w-sm w-full mx-4 space-y-5 shadow-xl">
        <div className="space-y-2 text-center">
          <div className="text-3xl">Bloqueado</div>
          <h2 className="font-heading font-bold text-xl text-vensato-text-main">Funcion bloqueada</h2>
          <p className="text-sm text-vensato-text-secondary">
            <span className="font-semibold text-vensato-text-main">{label}</span> esta disponible desde el plan{' '}
            {requiredTier && (
              <span className="font-semibold text-vensato-brand-primary">{TIER_NAMES[requiredTier]}</span>
            )}.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            onClick={() => { onClose(); router.push('/pricing') }}
            className="w-full bg-vensato-brand-primary hover:bg-[#5C7D6E] text-white font-semibold"
          >
            Ver planes
          </Button>
          <Button variant="ghost" onClick={onClose} className="w-full text-vensato-text-secondary">
            Ahora no
          </Button>
        </div>
      </div>
    </div>
  )
}
