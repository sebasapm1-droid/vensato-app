export type Tier = 'base' | 'inicio' | 'portafolio' | 'patrimonio'

export interface PlanConfig {
  maxProperties: number         // -1 = ilimitado
  maxUsers: number
  hasAgent: boolean
  hasChargeEmailManual: boolean
  hasChargeEmailAutomatic: boolean
  hasWompiCobros: boolean
  hasBovedaDocs: boolean
  hasNOI: boolean
  hasReportesAvanzados: boolean
  hasEmailRecordatorios: boolean
  hasWhatsappRecordatorios: boolean
  hasDIAN: boolean
  hasCopropiedad: boolean
  hasExportacionContable: boolean
  hasMultiUsuario: boolean
  bovedaStorageGB: number
  precioMensualCOP: number
}

export const PLANS: Record<Tier, PlanConfig> = {
  base: {
    maxProperties: 2, maxUsers: 1,
    hasAgent: false,
    hasChargeEmailManual: false,
    hasChargeEmailAutomatic: false,
    hasWompiCobros: false, hasBovedaDocs: false, hasNOI: false,
    hasReportesAvanzados: false, hasEmailRecordatorios: false,
    hasWhatsappRecordatorios: false, hasDIAN: false, hasCopropiedad: false,
    hasExportacionContable: false, hasMultiUsuario: false,
    bovedaStorageGB: 0, precioMensualCOP: 0,
  },
  inicio: {
    maxProperties: 5, maxUsers: 1,
    hasAgent: true,
    hasChargeEmailManual: true,
    hasChargeEmailAutomatic: false,
    hasWompiCobros: true, hasBovedaDocs: true, hasNOI: false,
    hasReportesAvanzados: false, hasEmailRecordatorios: false,
    hasWhatsappRecordatorios: false, hasDIAN: false, hasCopropiedad: false,
    hasExportacionContable: false, hasMultiUsuario: false,
    bovedaStorageGB: 1, precioMensualCOP: 15900,
  },
  portafolio: {
    maxProperties: 15, maxUsers: 1,
    hasAgent: true,
    hasChargeEmailManual: true,
    hasChargeEmailAutomatic: true,
    hasWompiCobros: true, hasBovedaDocs: true, hasNOI: true,
    hasReportesAvanzados: true, hasEmailRecordatorios: true,
    hasWhatsappRecordatorios: false, hasDIAN: false, hasCopropiedad: false,
    hasExportacionContable: false, hasMultiUsuario: false,
    bovedaStorageGB: 5, precioMensualCOP: 35000,
  },
  patrimonio: {
    maxProperties: -1, maxUsers: 4,
    hasAgent: true,
    hasChargeEmailManual: true,
    hasChargeEmailAutomatic: true,
    hasWompiCobros: true, hasBovedaDocs: true, hasNOI: true,
    hasReportesAvanzados: true, hasEmailRecordatorios: true,
    hasWhatsappRecordatorios: true, hasDIAN: true, hasCopropiedad: true,
    hasExportacionContable: true, hasMultiUsuario: true,
    bovedaStorageGB: 20, precioMensualCOP: 85000,
  },
}
