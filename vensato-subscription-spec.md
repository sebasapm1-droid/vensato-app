# Vensato — Especificación de features por tier y lógica de pagos

> **Instrucciones para el agente IDE:** Lee este documento completo antes de escribir una sola línea de código. Tu primera tarea es inspeccionar el esquema actual de la base de datos y compararlo con lo que se describe aquí. Para cada tabla mencionada, verifica si ya existe, qué columnas tiene, y recomienda únicamente los cambios necesarios (columnas faltantes, constraints, políticas RLS). No re-crees tablas que ya existen. Sigue el orden de las fases estrictamente.

---

## 1. Resumen de tiers

| Tier | Precio | Propiedades | Usuarios | Código interno |
|------|--------|-------------|----------|----------------|
| Base | $0 / mes | 2 | 1 | `base` |
| Inicio | $15.900 / mes | 5 | 1 | `inicio` |
| Portafolio | $35.000 / mes | 15 | 1 | `portafolio` |
| Patrimonio | $85.000 / mes | Ilimitadas | 4 | `patrimonio` |

---

## 2. Revisión y ajuste de tablas existentes

> **Agente:** Para cada tabla de esta sección, ejecuta primero en Supabase SQL Editor:
> ```sql
> SELECT column_name, data_type, is_nullable, column_default
> FROM information_schema.columns
> WHERE table_schema = 'public' AND table_name = 'NOMBRE_TABLA'
> ORDER BY ordinal_position;
> ```
> Luego compara con lo descrito abajo y aplica **solo** los `ALTER TABLE` necesarios para añadir columnas o constraints que falten. No toques columnas que ya existen.

---

### 2.1 Tabla `profiles` (ya existe)

Extiende `auth.users` de Supabase. Debe contener los campos de suscripción.

**Columnas que deben existir — añadir solo las que falten:**

```sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'base'
    CHECK (tier IN ('base', 'inicio', 'portafolio', 'patrimonio')),
  ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'active'
    CHECK (subscription_status IN ('active', 'past_due', 'cancelled', 'trialing')),
  ADD COLUMN IF NOT EXISTS subscription_valid_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS wompi_customer_id TEXT;
```

**RLS — verificar si ya tiene políticas, si no crearlas:**

```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can read own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);
```

---

### 2.2 Tabla `properties` (ya existe)

> **Agente:** Inspecciona columnas actuales. Debe tener FK a `profiles` y RLS activo.

**Columnas que deben existir — añadir solo las que falten:**

```sql
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS activa BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS canon_mensual INTEGER,
  ADD COLUMN IF NOT EXISTS area_m2 DECIMAL,
  ADD COLUMN IF NOT EXISTS tipo TEXT CHECK (
    tipo IN ('apartamento', 'casa', 'local', 'bodega', 'lote', 'otro')
  );
```

**RLS:**

```sql
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can crud own properties"
  ON public.properties USING (auth.uid() = user_id);
```

---

### 2.3 Tabla `tenants` (ya existe)

> **Agente:** Verifica que tenga FK a `properties` y a `profiles`, y que RLS esté activo.

**Columnas que deben existir — añadir solo las que falten:**

```sql
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS fecha_inicio_contrato DATE,
  ADD COLUMN IF NOT EXISTS fecha_fin_contrato DATE;
```

**RLS:**

```sql
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can crud own tenants"
  ON public.tenants USING (auth.uid() = user_id);
```

---

### 2.4 Tabla `contracts` (ya existe)

> **Agente:** Debe estar vinculada a `properties` y `tenants`. Verificar columnas actuales.

**Columnas que deben existir — añadir solo las que falten:**

```sql
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS canon_mensual INTEGER,
  ADD COLUMN IF NOT EXISTS fecha_inicio DATE,
  ADD COLUMN IF NOT EXISTS fecha_fin DATE,
  ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS r2_key TEXT; -- PDF del contrato guardado en R2
```

**RLS:**

```sql
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can crud own contracts"
  ON public.contracts USING (auth.uid() = user_id);
```

---

### 2.5 Tabla `charges` (ya existe)

> **Agente:** Esta tabla registra los cobros y cánones. Verificar columnas y añadir las que falten para el flujo de Wompi en fase 2.

**Columnas que deben existir — añadir solo las que falten:**

```sql
ALTER TABLE public.charges
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS monto INTEGER,
  ADD COLUMN IF NOT EXISTS fecha_vencimiento DATE,
  ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'pagado', 'vencido')),
  ADD COLUMN IF NOT EXISTS wompi_transaction_id TEXT,   -- se llena en fase 2
  ADD COLUMN IF NOT EXISTS wompi_payment_link TEXT,     -- se llena en fase 2
  ADD COLUMN IF NOT EXISTS comprobante_r2_key TEXT;     -- PDF del recibo en R2
```

**RLS:**

```sql
ALTER TABLE public.charges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can crud own charges"
  ON public.charges USING (auth.uid() = user_id);
```

---

### 2.6 Tabla `expenses` (ya existe)

> **Agente:** Registra gastos por propiedad. Se usa para calcular el NOI. Verificar columnas.

**Columnas que deben existir — añadir solo las que falten:**

```sql
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS categoria TEXT CHECK (
    categoria IN ('administracion', 'mantenimiento', 'predial', 'seguros', 'otro')
  ),
  ADD COLUMN IF NOT EXISTS fecha DATE;
```

**RLS:**

```sql
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can crud own expenses"
  ON public.expenses USING (auth.uid() = user_id);
```

---

### 2.7 Tablas `documents` y `documentos` (existen ambas — hay que consolidar)

> **Agente:** Tienes dos tablas de documentos. Haz lo siguiente:
> 1. Inspecciona ambas con la query de columnas
> 2. Determina cuál tiene más datos o está más desarrollada
> 3. Recomienda cuál conservar (preferiblemente `documents` para consistencia en inglés)
> 4. Si `documentos` tiene datos que no están en `documents`, migra primero:
>
> ```sql
> -- Solo ejecutar si documentos tiene datos útiles
> INSERT INTO public.documents SELECT * FROM public.documentos ON CONFLICT DO NOTHING;
> DROP TABLE public.documentos;
> ```
>
> 5. En la tabla que se conserve, añadir las columnas que falten:

```sql
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tipo TEXT CHECK (
    tipo IN ('contrato', 'foto', 'cedula', 'extracto', 'paz_y_salvo', 'otro')
  ),
  ADD COLUMN IF NOT EXISTS nombre_original TEXT,
  ADD COLUMN IF NOT EXISTS r2_key TEXT,
  ADD COLUMN IF NOT EXISTS tamanio_bytes INTEGER;

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can crud own documents"
  ON public.documents USING (auth.uid() = user_id);
```

---

### 2.8 Tabla `ipc_history` (ya existe)

> **Agente:** Guarda el histórico del IPC para ajustes de canon. Verificar estructura actual. Si tiene columnas `fecha` y `valor` (o similar), está correcta. Solo añadir RLS si no lo tiene:

```sql
-- Tabla de referencia global — todos los usuarios autenticados pueden leerla
ALTER TABLE public.ipc_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users can read ipc_history"
  ON public.ipc_history FOR SELECT TO authenticated USING (true);
```

---

## 3. Tablas nuevas que hay que crear

> **Agente:** Verifica primero con `SELECT * FROM information_schema.tables WHERE table_name = 'NOMBRE'` que no existan antes de crearlas.

### 3.1 Tabla `subscriptions`

```sql
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('inicio', 'portafolio', 'patrimonio')),
  status TEXT NOT NULL CHECK (status IN ('active', 'past_due', 'cancelled')),
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual')),
  amount_cop INTEGER NOT NULL,
  wompi_subscription_id TEXT,
  wompi_payment_source_id TEXT,
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can read own subscriptions"
  ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
```

### 3.2 Tabla `workspace_members`

```sql
CREATE TABLE IF NOT EXISTS public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('viewer', 'editor', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(owner_id, member_id)
);

ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners can manage members"
  ON public.workspace_members USING (auth.uid() = owner_id);

CREATE POLICY "members can read their membership"
  ON public.workspace_members FOR SELECT USING (auth.uid() = member_id);
```

### 3.3 Tabla `invitaciones`

```sql
CREATE TABLE IF NOT EXISTS public.invitaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('viewer', 'editor', 'admin')),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '48 hours',
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.4 Tabla `recordatorio_config`

```sql
CREATE TABLE IF NOT EXISTS public.recordatorio_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  dias_anticipacion INTEGER DEFAULT 3,
  email_activo BOOLEAN DEFAULT TRUE,
  whatsapp_activo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.recordatorio_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can manage own recordatorio_config"
  ON public.recordatorio_config USING (auth.uid() = user_id);
```

### 3.5 Tabla `copropietarios` (solo si no existe)

```sql
CREATE TABLE IF NOT EXISTS public.copropietarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  cedula TEXT,
  email TEXT,
  porcentaje DECIMAL NOT NULL CHECK (porcentaje > 0 AND porcentaje <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.copropietarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can manage own copropietarios"
  ON public.copropietarios
  USING (
    property_id IN (
      SELECT id FROM public.properties WHERE user_id = auth.uid()
    )
  );
```

---

## 4. Lógica de permisos en código

### 4.1 `lib/plans.ts` — fuente de verdad de permisos

```typescript
export type Tier = 'base' | 'inicio' | 'portafolio' | 'patrimonio'

export interface PlanConfig {
  maxProperties: number         // -1 = ilimitado
  maxUsers: number
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
    hasWompiCobros: false, hasBovedaDocs: false, hasNOI: false,
    hasReportesAvanzados: false, hasEmailRecordatorios: false,
    hasWhatsappRecordatorios: false, hasDIAN: false, hasCopropiedad: false,
    hasExportacionContable: false, hasMultiUsuario: false,
    bovedaStorageGB: 0, precioMensualCOP: 0,
  },
  inicio: {
    maxProperties: 5, maxUsers: 1,
    hasWompiCobros: true, hasBovedaDocs: true, hasNOI: false,
    hasReportesAvanzados: false, hasEmailRecordatorios: false,
    hasWhatsappRecordatorios: false, hasDIAN: false, hasCopropiedad: false,
    hasExportacionContable: false, hasMultiUsuario: false,
    bovedaStorageGB: 1, precioMensualCOP: 15900,
  },
  portafolio: {
    maxProperties: 15, maxUsers: 1,
    hasWompiCobros: true, hasBovedaDocs: true, hasNOI: true,
    hasReportesAvanzados: true, hasEmailRecordatorios: true,
    hasWhatsappRecordatorios: false, hasDIAN: false, hasCopropiedad: false,
    hasExportacionContable: false, hasMultiUsuario: false,
    bovedaStorageGB: 5, precioMensualCOP: 35000,
  },
  patrimonio: {
    maxProperties: -1, maxUsers: 4,
    hasWompiCobros: true, hasBovedaDocs: true, hasNOI: true,
    hasReportesAvanzados: true, hasEmailRecordatorios: true,
    hasWhatsappRecordatorios: true, hasDIAN: true, hasCopropiedad: true,
    hasExportacionContable: true, hasMultiUsuario: true,
    bovedaStorageGB: 20, precioMensualCOP: 85000,
  },
}
```

### 4.2 `lib/permissions.ts`

```typescript
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
```

### 4.3 `lib/middleware/requirePlan.ts`

```typescript
import { createClient } from '@/lib/supabase-server'
import { getPlan, getEffectiveTier } from '@/lib/permissions'
import { PlanConfig } from '@/lib/plans'
import { NextRequest, NextResponse } from 'next/server'

export function requireFeature(feature: keyof PlanConfig) {
  return async (req: NextRequest): Promise<NextResponse | null> => {
    const supabase = createClient()
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

    return null // null = acceso permitido
  }
}
```

### 4.4 `hooks/usePlan.ts`

```typescript
'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-client'
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
```

### 4.5 `components/PlanGate.tsx`

```typescript
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

// Uso:
// <PlanGate feature="hasNOI" fallback={<UpgradeButton requiredTier="portafolio" />}>
//   <TableroNOI />
// </PlanGate>
```

### 4.6 `components/UpgradeModal.tsx` — labels y tiers requeridos

```typescript
import { PlanConfig, Tier } from '@/lib/plans'

// En fase 1: el botón lleva a /pricing (estático)
// En fase 2: inicia el flujo de Wompi

export const FEATURE_LABELS: Partial<Record<keyof PlanConfig, string>> = {
  hasWompiCobros: 'Cobros automáticos a inquilinos',
  hasBovedaDocs: 'Bóveda de documentos',
  hasNOI: 'Tableros de rentabilidad y NOI',
  hasReportesAvanzados: 'Reportes financieros avanzados',
  hasEmailRecordatorios: 'Recordatorios automáticos por email',
  hasWhatsappRecordatorios: 'Recordatorios por WhatsApp',
  hasDIAN: 'Facturación electrónica DIAN',
  hasCopropiedad: 'División de copropiedad',
  hasExportacionContable: 'Exportación contable avanzada',
  hasMultiUsuario: 'Usuarios adicionales en el workspace',
  maxProperties: 'Más propiedades en tu portafolio',
}

export const FEATURE_REQUIRED_TIER: Partial<Record<keyof PlanConfig, Tier>> = {
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
```

---

## 5. Validaciones clave en endpoints

### Límite de propiedades — `POST /api/properties`

```typescript
const { count } = await supabase
  .from('properties')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', user.id)
  .eq('activa', true)

if (!canAddProperty(profile, count ?? 0)) {
  return NextResponse.json({
    error: 'property_limit_reached',
    limit: getPlan(profile).maxProperties,
    current: count,
  }, { status: 403 })
}
```

### Límite de almacenamiento — `POST /api/documents/upload-url`

```typescript
const guard = await requireFeature('hasBovedaDocs')(req)
if (guard) return guard

const { data: docs } = await supabase
  .from('documents')
  .select('tamanio_bytes')
  .eq('user_id', user.id)

const usedBytes = docs?.reduce((sum, d) => sum + (d.tamanio_bytes ?? 0), 0) ?? 0
const limitBytes = getPlan(profile).bovedaStorageGB * 1024 * 1024 * 1024

if (usedBytes + newFileSize > limitBytes) {
  return NextResponse.json({ error: 'storage_limit_reached' }, { status: 403 })
}
```

### Features con `requireFeature`

```typescript
// Aplicar al inicio de cada endpoint de feature bloqueado:
const guard = await requireFeature('hasNOI')(req)           // GET /api/reportes/noi
const guard = await requireFeature('hasWompiCobros')(req)   // POST /api/charges
const guard = await requireFeature('hasReportesAvanzados')(req) // POST /api/reportes/generar
const guard = await requireFeature('hasExportacionContable')(req) // GET /api/exportar/contabilidad
if (guard) return guard
```

---

## 6. Lógica de degradación de tier

**Qué se conserva siempre (datos nunca se borran):**
- Propiedades, tenants, contratos, charges, expenses, documentos en R2

**Qué se bloquea al vencer:**
- Crear propiedades si ya tiene más de 2
- Subir documentos a la bóveda
- Acceder a NOI, reportes y exportaciones
- Generar cobros via Wompi
- Recordatorios automáticos

**Cron job diario (Vercel Cron o Supabase Edge Function):**

```typescript
async function checkExpiredSubscriptions() {
  const { data: expired } = await supabase
    .from('profiles')
    .select('id')
    .neq('tier', 'base')
    .lt('subscription_valid_until', new Date().toISOString())
    .eq('subscription_status', 'active')

  for (const user of expired ?? []) {
    await supabase
      .from('profiles')
      .update({ tier: 'base', subscription_status: 'cancelled' })
      .eq('id', user.id)
    // TODO fase 2: enviar email de notificación
  }
}
```

> `getEffectiveTier()` ya maneja la degradación en tiempo real para cada request. El cron solo actualiza la BD para consistencia.

---

## 7. Orden de implementación

### Fase 1 — Features sin pagos (implementar ahora)

> **Agente:** Sigue este orden estrictamente.

1. Ejecutar queries de inspección en cada tabla existente
2. Aplicar `ALTER TABLE` solo para columnas faltantes
3. Resolver duplicación `documents` vs `documentos`
4. Crear tablas nuevas: `subscriptions`, `workspace_members`, `invitaciones`, `recordatorio_config`, `copropietarios`
5. Crear `lib/plans.ts`
6. Crear `lib/permissions.ts`
7. Crear `lib/middleware/requirePlan.ts`
8. Crear `hooks/usePlan.ts`
9. Crear `components/PlanGate.tsx`
10. Crear `components/UpgradeModal.tsx` (botón lleva a `/pricing` estático)
11. Integrar `requireFeature` en todos los endpoints de API existentes
12. Integrar `PlanGate` en todos los componentes de UI que correspondan
13. Validación de límite de propiedades en `POST /api/properties`
14. Validación de almacenamiento en endpoint de upload de documentos
15. Cron job de degradación de suscripciones vencidas

**Al terminar la fase 1:** Probar cambiando `profiles.tier` directamente en Supabase para cada tier y verificar que los bloqueos funcionan en UI y API.

### Fase 2 — Integración con Wompi (después)

Solo comenzar cuando la fase 1 esté 100% probada.

1. Registro en Wompi y llaves de producción
2. Endpoint de suscripción con tokenización de tarjeta/Nequi
3. Webhook `POST /api/webhooks/wompi` → actualizar `profiles.tier` y `subscription_valid_until`
4. Reemplazar botón estático de upgrade por flujo de pago real
5. Portal de gestión: cancelar plan, cambiar tier
6. Emails de confirmación via Resend

---

## 8. Variables de entorno

```env
# Ya configuradas
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CLOUDFLARE_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=

# Añadir para fase 1
RESEND_API_KEY=          # resend.com — gratis hasta 3.000 emails/mes

# Añadir para fase 2
WOMPI_PUBLIC_KEY=
WOMPI_PRIVATE_KEY=
WOMPI_EVENTS_SECRET=
```

---

## 9. Checklist antes de pasar a fase 2

- [ ] `tier = 'base'`: no puede crear propiedad #3, no ve bóveda
- [ ] `tier = 'inicio'`: puede subir docs, no ve NOI ni reportes
- [ ] `tier = 'portafolio'`: ve NOI y reportes, no ve WhatsApp ni DIAN
- [ ] `tier = 'patrimonio'`: acceso completo
- [ ] `subscription_valid_until` en el pasado → tratado como `base`
- [ ] Endpoints retornan `403` con `error: 'upgrade_required'`
- [ ] `UpgradeModal` muestra mensaje correcto por feature
- [ ] Cron de degradación funciona correctamente

---

*Fin del documento. Implementar fase 1 completamente antes de continuar con Wompi.*