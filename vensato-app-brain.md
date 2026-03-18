# Vensato App — Master Engineering & Product Brief
**Dominio:** `app.vensato.com`  
**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Supabase · Framer Motion  
**Versión del documento:** 1.0  
**Fecha:** 2026-03

---

## 0. Filosofía del Proyecto (LEE ESTO PRIMERO)

Vensato es un **Property Management System (PMS) premium y ligero** para inversionistas inmobiliarios independientes en Colombia. El usuario no es una corporación — es una persona natural con 1 a 20 propiedades que busca:

1. **Paz mental:** Todo organizado en un solo lugar, sin Excel ni cuadernos.
2. **Control financiero real:** Saber exactamente cuánto gana cada propiedad (Cap Rate, NOI).
3. **Automatización de cobros:** No perseguir inquilinos ni calcular manualmente el IPC cada enero.
4. **Retener el 100% de su rentabilidad:** Sin pagar comisión a inmobiliarias.

### Reglas de ingeniería estrictas (NO AI SLOP)
- **DRY y modular:** Si un componente se usa dos veces, se extrae. Cero divs envolventes innecesarios.
- **TypeScript estricto:** `strict: true` en `tsconfig.json`. No usar `any`.
- **Componentes atómicos:** Button, Card, Badge, Input, Modal, etc. viven en `/components/ui/`.
- **Performance premium:** La app debe sentirse como Linear o Stripe — rápida, fluida, densa en información.
- **Animaciones deliberadas:** Framer Motion para transiciones de página y reveal. Tailwind para micro-interacciones hover. Nada exagerado.
- **Preguntar antes de decidir:** Si hay ambigüedad visual o de producto, documentarla aquí como `[DECISIÓN PENDIENTE]` antes de implementar.

---

## 1. Sistema de Diseño (Design DNA)

El diseño de la app **hereda directamente** la identidad de `vensato.com`. Light Mode exclusivo.

### 1.1 Paleta "Salvia Financiera"

| Token              | Hex       | Uso                                                    |
|--------------------|-----------|--------------------------------------------------------|
| `bg-base`          | `#F7F9F8` | Fondo principal de la app. NUNCA blanco puro.          |
| `surface`          | `#FFFFFF` | Cards, modals, sidebars, paneles.                      |
| `brand-primary`    | `#6B9080` | Botones primarios, acentos, gráficos positivos, links. |
| `text-main`        | `#1F2924` | Texto principal. Máxima legibilidad.                   |
| `accent-punch`     | `#E07A5F` | CTAs secundarios, badges de alerta, detalles vibrantes.|
| `text-secondary`   | `#728178` | Labels, captions, texto de apoyo.                      |
| `border-subtle`    | `#E4EAE7` | Bordes de cards, divisores, inputs.                    |
| `success`          | `#4CAF82` | Valores positivos, pagos confirmados.                  |
| `warning`          | `#F0B429` | Alertas de vencimiento próximo.                        |
| `danger`           | `#E53E3E` | Pagos vencidos, errores críticos.                      |

Configurar en `tailwind.config.ts` bajo `theme.extend.colors.vensato`.

### 1.2 Tipografía

```
Headings de sección (H1, H2): Playfair Display — serif, weight 700
UI, labels, body, botones, tablas: Plus Jakarta Sans — sans-serif, weight 400/500/600
Números financieros (métricas, montos): Plus Jakarta Sans, weight 600, tabular-nums
```

Cargar con `next/font/google` en `app/layout.tsx`. Asignar como variables CSS (`--font-heading`, `--font-ui`).

### 1.3 Estilo Visual

- **Sombras:** `shadow-sm` para cards en reposo. `shadow-lg` para modals y dropdowns. `shadow-xl` difuminada para elementos flotantes premium.
- **Bordes:** `rounded-xl` para cards principales. `rounded-lg` para inputs y botones. `rounded-2xl` para modals.
- **Spacing:** Sistema base-8 de Tailwind. Secciones internas con `p-6`, dashboards con `p-8`, gap entre cards `gap-4` o `gap-6`.
- **Whitespace:** La interfaz debe respirar. Preferir menos elementos bien espaciados que muchos elementos comprimidos.
- **Iconos:** Usar exclusivamente `lucide-react`. Tamaño estándar `16px` (inline) y `20px` (standalone).
- **Avatares/Vacíos:** Diseñar empty states propios con ilustración SVG minimalista en paleta salvia. Nunca usar placeholders genéricos.

---

## 2. Arquitectura del Proyecto

### 2.1 Stack Completo

```
Frontend:      Next.js 14 (App Router, RSC)
Lenguaje:      TypeScript 5 (strict mode)
Estilos:       Tailwind CSS 3.4
Animaciones:   Framer Motion 11
Iconos:        lucide-react
Auth:          Supabase Auth (email/password + magic link)
Base de datos: Supabase (PostgreSQL)
Storage:       Supabase Storage (bóveda documental)
Email:         Resend (recordatorios, cuentas de cobro)
PDF:           @react-pdf/renderer (generación de cuentas de cobro)
Pagos:         Wompi (Colombia) — integración futura Plan Portafolio+
Formularios:   react-hook-form + zod
Estado global: Zustand (ligero, solo para UI state global)
Tablas:        TanStack Table v8
Gráficas:      Recharts
Hosting:       Vercel (subdominio app.vensato.com)
```

### 2.2 Estructura de Carpetas

```
app.vensato.com/
├── app/
│   ├── (auth)/                  # Grupo de rutas públicas (sin layout de app)
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── forgot-password/page.tsx
│   ├── (dashboard)/             # Grupo de rutas protegidas (con layout de app)
│   │   ├── layout.tsx           # Shell: Sidebar + Header + main
│   │   ├── page.tsx             # /  → Dashboard principal
│   │   ├── propiedades/
│   │   │   ├── page.tsx         # Lista de propiedades
│   │   │   └── [id]/page.tsx    # Detalle de propiedad
│   │   ├── inquilinos/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── cobros/
│   │   │   ├── page.tsx         # Recaudo y estado de pagos
│   │   │   └── nueva/page.tsx
│   │   ├── contratos/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── documentos/page.tsx  # Bóveda documental
│   │   ├── reportes/page.tsx    # Rentabilidad y NOI
│   │   └── configuracion/page.tsx
│   ├── layout.tsx               # Root layout (fuentes, providers)
│   └── not-found.tsx
├── components/
│   ├── ui/                      # Átomos: Button, Input, Card, Badge, Modal, Select...
│   ├── layout/                  # Sidebar, Header, PageHeader
│   ├── propiedades/             # PropertyCard, PropertyForm, PropertyMetrics
│   ├── cobros/                  # PaymentStatusBadge, CobrosTable, CobroForm
│   ├── contratos/               # ContratoCard, ContratoForm, IPCAlert
│   ├── reportes/                # CapRateCard, NOIChart, RentabilityTable
│   ├── documentos/              # DocumentVault, FileUploader, DocumentCard
│   └── shared/                  # EmptyState, LoadingSkeleton, ConfirmDialog
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # createBrowserClient
│   │   ├── server.ts            # createServerClient
│   │   └── middleware.ts
│   ├── validations/             # Schemas zod por módulo
│   ├── utils/
│   │   ├── currency.ts          # Formateo COP, UVT
│   │   ├── ipc.ts               # Cálculo incremento IPC
│   │   ├── caprate.ts           # Fórmulas Cap Rate, NOI, ROI
│   │   └── dates.ts             # Helpers de fechas colombianas
│   └── constants.ts             # Plan limits, IPC histórico, etc.
├── hooks/
│   ├── use-propiedades.ts
│   ├── use-cobros.ts
│   ├── use-contratos.ts
│   └── use-user-plan.ts         # Feature flags según plan activo
├── types/
│   └── database.ts              # Tipos generados de Supabase
├── middleware.ts                 # Protección de rutas auth
└── supabase/
    └── migrations/              # SQL migrations versionadas
```

---

## 3. Autenticación

### 3.1 Proveedor
Supabase Auth. Métodos habilitados:
- Email/Password (registro principal)
- Magic Link (login rápido)
- [FUTURO] Google OAuth

### 3.2 Flujo de Auth

```
/register → Crea cuenta → Email de confirmación (Supabase) → /login
/login → Sesión activa → Redirect a /  (dashboard)
Sesión expirada → Middleware redirect a /login
/forgot-password → Email con link → Reset password
```

### 3.3 Middleware de Protección
`middleware.ts` en la raíz verifica la sesión de Supabase en cada request al grupo `(dashboard)`. Si no hay sesión válida, redirige a `/login`.

### 3.4 Perfil de Usuario
Al registrarse, se crea automáticamente una fila en la tabla `profiles` (trigger de Supabase) con:
- `id` (FK → `auth.users`)
- `full_name`
- `plan` (default: `'base'`)
- `plan_expires_at`
- `created_at`

### 3.5 UI de Auth
- Fondo `#F7F9F8` con un panel central blanco (`shadow-xl`, `rounded-2xl`).
- Logo "Vensato" en Playfair Display arriba del formulario.
- Inputs limpios con label flotante o label superior.
- Botón CTA en `accent-punch` (`#E07A5F`) para el registro, `brand-primary` para el login.
- Link de retorno a `vensato.com` en el footer del panel.

---

## 4. Módulos de la Aplicación

### 4.1 Dashboard Principal (`/`)

**Propósito:** Vista ejecutiva de todo el portafolio. Responde "¿Cómo estoy hoy?" en 5 segundos.

**Métricas del top (KPI Cards):**
- Ingresos totales del mes (COP)
- Pagos pendientes / vencidos
- Cap Rate promedio del portafolio (%)
- Número de propiedades activas

**Secciones:**
- Gráfico de ingresos últimos 6 meses (Recharts, color `brand-primary`)
- Lista de cobros próximos a vencer (siguiente semana)
- Alertas activas (IPC, predial, contratos por vencer)
- Acceso rápido: "+ Propiedad", "+ Cobro", "Ver reportes"

**Componente de Alertas Inteligentes:**
Un banner/card de alta visibilidad que aparece cuando:
- Hay cobros vencidos hace más de 3 días
- Un contrato vence en menos de 60 días
- Se acerca enero (recordatorio de ajuste IPC)
- El predial de alguna propiedad está próximo

---

### 4.2 Propiedades (`/propiedades`)

**Propósito:** Gestión del inventario de inmuebles del usuario.

**Lista:** Grid de cards por propiedad. Cada card muestra:
- Nombre/alias de la propiedad
- Ciudad y tipo (Apartamento, Casa, Local, etc.)
- Inquilino activo (si aplica)
- Canon actual en COP
- Cap Rate badge
- Estado: Ocupada / Vacante / En proceso

**Formulario de creación/edición (`PropertyForm`):**
```
Información básica:
- Nombre alias (ej: "Apto 301 Laureles")
- Tipo de propiedad (select)
- Dirección completa
- Ciudad / Barrio
- Matrícula inmobiliaria (opcional)

Datos financieros:
- Valor comercial estimado
- Canon de arrendamiento actual (COP)
- Administración (COP, si aplica)
- Valor del predial anual (COP)

Datos del inmueble:
- Área en m²
- Número de habitaciones / baños
- Estrato
- Notas internas
```

**Vista de detalle `[id]`:**
- Tab "Resumen": métricas financieras de la propiedad (Cap Rate, ROI, NOI anual).
- Tab "Cobros": historial de pagos del inquilino.
- Tab "Contratos": contratos asociados.
- Tab "Documentos": archivos de esta propiedad.
- Tab "Gastos": registro de gastos de mantenimiento.

**Límites por plan:**
- Base: máximo 2 propiedades
- Portafolio: máximo 15 propiedades
- Patrimonio: ilimitadas

---

### 4.3 Inquilinos (`/inquilinos`)

**Propósito:** CRM ligero de inquilinos.

**Lista:** Tabla con nombre, propiedad asignada, estado del contrato, último pago, y acciones.

**Perfil del inquilino:**
```
Datos personales:
- Nombre completo
- Cédula / NIT
- Email de contacto
- Teléfono (WhatsApp preferido)
- Dirección de notificación

Datos del arrendamiento:
- Propiedad asignada (FK)
- Contrato activo (FK)
- Fecha de inicio del contrato
- Canon actual

Historial:
- Lista de cobros y su estado
- Documentos asociados al inquilino (copia cédula, etc.)
```

---

### 4.4 Cobros y Recaudo (`/cobros`)

**Propósito:** Motor central del producto. El arrendador gestiona el ciclo de cobro sin Excel.

**Vista principal:**
- Tabs: "Pendientes" | "Pagados" | "Vencidos" | "Todos"
- Tabla con columnas: Inquilino, Propiedad, Concepto, Monto, Fecha vencimiento, Estado, Acciones.
- Badge de estado con color semántico (warning amarillo, danger rojo, success verde).

**Crear cobro:**
```
- Inquilino (select)
- Concepto: Arriendo / Administración / Cuota extraordinaria / Otro
- Monto (COP) — se puede pre-llenar desde el contrato
- Fecha de vencimiento
- Notas para el inquilino
- ¿Generar cuenta de cobro en PDF? (toggle)
- ¿Enviar por email al inquilino? (toggle — requiere Resend configurado)
```

**Cuenta de cobro en PDF (`@react-pdf/renderer`):**
Genera un documento PDF limpio con:
- Logo y nombre "Vensato" con branding del arrendador
- Datos del arrendador (nombre, cédula, cuenta bancaria)
- Datos del inquilino
- Descripción del cobro (mes, concepto)
- Valor en letras y números (COP)
- Instrucciones de pago (transferencia, Nequi, Llave)
- QR o instrucciones de pago Wompi (Plan Portafolio+)

**Métodos de pago por plan:**
- Base: Transferencia bancaria / Nequi / Llave (manual, el propietario confirma)
- Portafolio+: Link de pago Wompi (automatizado, confirmación webhooks)

**Recordatorios automáticos (Plan Portafolio+):**
- Email D-5, D-1 antes del vencimiento (Resend)
- WhatsApp D-1 (Plan Patrimonio — integración con WABA o Twilio)

---

### 4.5 Contratos (`/contratos`)

**Propósito:** Repositorio y seguimiento del ciclo de vida contractual.

**Lista:** Tabla con propiedad, inquilino, fecha inicio, fecha fin, próximo incremento IPC, estado.

**Formulario de contrato:**
```
- Propiedad (FK)
- Inquilino (FK)
- Fecha de inicio
- Duración (meses) — calcula automáticamente fecha de vencimiento
- Canon inicial (COP)
- Cláusula de incremento: IPC anual (Colombia, automático) / Porcentaje fijo / Manual
- Mes de incremento (por defecto: enero)
- Depósito (meses de garantía)
- Notas / cláusulas especiales

Archivos adjuntos:
- Subir contrato firmado (PDF/imagen) → Supabase Storage
```

**Motor de IPC (`lib/utils/ipc.ts`):**
```typescript
// Lógica:
// 1. Almacenar en DB el IPC histórico anual de Colombia (DANE).
// 2. Al acercarse el mes de incremento (configurable, default enero),
//    lanzar alerta con el nuevo canon calculado.
// 3. El usuario aprueba el nuevo canon → se actualiza en el contrato
//    y se refleja en los cobros futuros.

// Fórmula:
// nuevo_canon = canon_actual * (1 + ipc_anual / 100)
```

**Alertas de vencimiento:**
- 60 días antes: alerta amarilla en dashboard
- 30 días antes: alerta naranja
- Contrato vencido y sin renovar: alerta roja

---

### 4.6 Bóveda Documental (`/documentos`)

**Propósito:** Repositorio seguro en la nube. El fin de las carpetas físicas y los emails enterrados.

**Tipos de documentos:**
- Contratos de arrendamiento
- Escrituras y matrículas inmobiliarias
- Paz y salvos de servicios públicos
- Paz y salvos de administración
- Copias de cédulas (arrendador/inquilino)
- Reglamentos de propiedad horizontal
- Facturas de mantenimiento
- Declaraciones de predial

**Vista:** Grid de cards de documentos. Filtros por: propiedad, tipo, fecha, inquilino.

**Subida de archivos:**
- Drag & drop o selector de archivo
- Formatos: PDF, JPG, PNG, DOCX
- Tamaño máximo: 10MB por archivo
- Storage: Supabase Storage con paths organizados: `/{user_id}/{propiedad_id}/{tipo}/{filename}`
- Acceso firmado (URLs temporales, no públicas)

**Límites por plan:**
- Base: sin bóveda (módulo bloqueado, mostrar upsell)
- Portafolio+: almacenamiento incluido (límite razonable, ej: 2GB)
- Patrimonio: almacenamiento extendido (ej: 10GB)

---

### 4.7 Reportes y Rentabilidad (`/reportes`)

**Propósito:** El CFO personal del arrendador independiente.

**Métricas calculadas (`lib/utils/caprate.ts`):**

```typescript
// Cap Rate (tasa de capitalización)
// cap_rate = (NOI_anual / valor_comercial) * 100
// Donde NOI = Ingresos_brutos_anuales - Gastos_operativos_anuales

// NOI (Net Operating Income)
// noi = ingresos_arrendamiento - predial - admin - mantenimiento - seguros

// ROI simple
// roi = (noi / inversion_total) * 100

// Yield bruto
// yield_bruto = (canon_anual / valor_comercial) * 100
```

**Vistas del reporte:**
- **Resumen del portafolio:** Tabla comparativa de todas las propiedades con Cap Rate, NOI, yield bruto.
- **Gráfico de ingresos:** Recharts, vista mensual y anual, desglosado por propiedad.
- **Gráfico de gastos:** Donut chart con categorías (predial, mantenimiento, vacancia, etc.).
- **Flujo de caja mensual:** Tabla ingresos vs gastos vs neto por mes.

**Exportación (Plan Portafolio+):**
- Exportar reporte en PDF (diseñado, no solo tabla)
- Exportar flujo de caja en CSV/Excel

---

### 4.8 Configuración (`/configuracion`)

**Tabs:**

**Perfil:**
- Nombre completo, cédula, email de contacto.
- Datos bancarios para cuentas de cobro (banco, tipo de cuenta, número, nombre titular).
- Logo del arrendador (opcional, aparece en PDFs).

**Plan y facturación:**
- Plan activo, fecha de renovación.
- Botón de upgrade con pricing inline.
- Historial de pagos (futuro).

**Notificaciones:**
- Toggle: Alertas de vencimiento de cobros (email).
- Toggle: Alertas de IPC (email).
- Toggle: Alertas de contratos próximos a vencer (email).
- [Patrimonio] Toggle: Recordatorios WhatsApp.

**Integraciones (roadmap visible):**
- Wompi: conectar cuenta (Plan Portafolio+). Estado: `Conectado` / `Pendiente`.
- Fincaraíz: sincronización de listados (próximamente, badge "Beta").
- Metrocuadrado: sincronización de listados (próximamente, badge "Beta").
- DIAN (Facturación electrónica): Solo Plan Patrimonio (próximamente).

---

## 5. Base de Datos (Supabase / PostgreSQL)

### 5.1 Tablas Principales

```sql
-- Perfil de usuario (creado por trigger en auth.users)
profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users,
  full_name   text,
  cedula      text,
  email       text,
  phone       text,
  plan        text DEFAULT 'base' CHECK (plan IN ('base','portafolio','patrimonio')),
  plan_expires_at timestamptz,
  bank_name   text,
  bank_account_type text,
  bank_account_number text,
  bank_account_holder text,
  logo_url    text,
  created_at  timestamptz DEFAULT now()
)

-- Propiedades
properties (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES profiles(id) ON DELETE CASCADE,
  alias         text NOT NULL,
  type          text, -- apartamento, casa, local, bodega, etc.
  address       text,
  city          text,
  neighborhood  text,
  matricula     text,
  area_m2       numeric,
  bedrooms      int,
  bathrooms     int,
  estrato       int,
  commercial_value  numeric, -- para Cap Rate
  current_rent  numeric,
  admin_fee     numeric DEFAULT 0,
  predial_annual numeric DEFAULT 0,
  status        text DEFAULT 'occupied' CHECK (status IN ('occupied','vacant','in_process')),
  notes         text,
  created_at    timestamptz DEFAULT now()
)

-- Inquilinos
tenants (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES profiles(id) ON DELETE CASCADE,
  property_id   uuid REFERENCES properties(id),
  full_name     text NOT NULL,
  cedula        text,
  email         text,
  phone         text,
  whatsapp      text,
  notification_address text,
  created_at    timestamptz DEFAULT now()
)

-- Contratos
contracts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid REFERENCES profiles(id) ON DELETE CASCADE,
  property_id       uuid REFERENCES properties(id),
  tenant_id         uuid REFERENCES tenants(id),
  start_date        date NOT NULL,
  end_date          date,
  duration_months   int,
  initial_rent      numeric NOT NULL,
  current_rent      numeric NOT NULL,
  increment_type    text DEFAULT 'ipc' CHECK (increment_type IN ('ipc','fixed_percent','manual')),
  increment_month   int DEFAULT 1, -- enero=1
  deposit_months    int DEFAULT 1,
  deposit_amount    numeric,
  status            text DEFAULT 'active' CHECK (status IN ('active','expired','terminated')),
  file_url          text, -- Supabase Storage URL del contrato firmado
  notes             text,
  created_at        timestamptz DEFAULT now()
)

-- Cobros
charges (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES profiles(id) ON DELETE CASCADE,
  property_id     uuid REFERENCES properties(id),
  tenant_id       uuid REFERENCES tenants(id),
  contract_id     uuid REFERENCES contracts(id),
  concept         text NOT NULL, -- arriendo, admin, extraordinario, otro
  amount          numeric NOT NULL,
  due_date        date NOT NULL,
  paid_date       date,
  payment_method  text, -- transferencia, nequi, llave, wompi
  status          text DEFAULT 'pending' CHECK (status IN ('pending','paid','overdue','cancelled')),
  pdf_url         text, -- Supabase Storage URL de la cuenta de cobro
  notes           text,
  created_at      timestamptz DEFAULT now()
)

-- Gastos de propiedades
expenses (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES profiles(id) ON DELETE CASCADE,
  property_id   uuid REFERENCES properties(id),
  category      text, -- predial, mantenimiento, admin, seguro, otro
  description   text,
  amount        numeric NOT NULL,
  date          date NOT NULL,
  receipt_url   text,
  created_at    timestamptz DEFAULT now()
)

-- Documentos (bóveda)
documents (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES profiles(id) ON DELETE CASCADE,
  property_id   uuid REFERENCES properties(id),
  tenant_id     uuid REFERENCES tenants(id),
  type          text, -- contrato, escritura, paz_y_salvo, cedula, predial, otro
  name          text NOT NULL,
  file_url      text NOT NULL, -- Supabase Storage
  file_size     int, -- bytes
  mime_type     text,
  uploaded_at   timestamptz DEFAULT now()
)

-- IPC histórico Colombia (seed data)
ipc_history (
  year  int PRIMARY KEY,
  rate  numeric NOT NULL -- porcentaje, ej: 9.94 para 2022
)
```

### 5.2 Row Level Security (RLS)

**CRÍTICO:** Habilitar RLS en todas las tablas. Política base para cada tabla:

```sql
-- Ejemplo para properties (replicar en todas las tablas)
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own properties"
ON properties FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

---

## 6. Feature Flags por Plan

Centralizar en `hooks/use-user-plan.ts`:

```typescript
type Plan = 'base' | 'portafolio' | 'patrimonio'

const PLAN_LIMITS = {
  base: {
    maxProperties: 2,
    maxUsers: 1,
    documentVault: false,
    wompiIntegration: false,
    advancedReports: false,
    emailReminders: false,
    whatsappReminders: false,
    electronicInvoicing: false,
    coOwnershipManagement: false,
    exportReports: false,
  },
  portafolio: {
    maxProperties: 15,
    maxUsers: 1,
    documentVault: true,
    wompiIntegration: true,
    advancedReports: true,
    emailReminders: true,
    whatsappReminders: false,
    electronicInvoicing: false,
    coOwnershipManagement: false,
    exportReports: true,
  },
  patrimonio: {
    maxProperties: Infinity,
    maxUsers: 4,
    documentVault: true,
    wompiIntegration: true,
    advancedReports: true,
    emailReminders: true,
    whatsappReminders: true,
    electronicInvoicing: true,
    coOwnershipManagement: true,
    exportReports: true,
  },
} as const
```

Cuando un usuario intenta acceder a un feature bloqueado, mostrar un componente `<UpgradePrompt />` inline (no un modal disruptivo) con el CTA de upgrade.

---

## 7. Layout de la App

### 7.1 Shell principal (aplica a todas las rutas `(dashboard)`)

```
┌─────────────────────────────────────────────────────┐
│  SIDEBAR (240px, fijo, fondo #FFFFFF, shadow-sm)    │
│  ┌─────────────────────────────────────────────────┐│
│  │ Logo "Vensato" (Playfair Display, bold)         ││
│  │ ─────────────────────────────────────────────── ││
│  │ ● Dashboard                                     ││
│  │ ● Propiedades                                   ││
│  │ ● Inquilinos                                    ││
│  │ ● Cobros                        ← badge número  ││
│  │ ● Contratos                                     ││
│  │ ● Documentos                                    ││
│  │ ● Reportes                                      ││
│  │ ─────────────────────────────────────────────── ││
│  │ ● Configuración                                 ││
│  │ ─────────────────────────────────────────────── ││
│  │ [Avatar] Nombre usuario                         ││
│  │ Plan: Portafolio                                ││
│  └─────────────────────────────────────────────────┘│
│                                                      │
│  MAIN CONTENT (flex-1, bg: #F7F9F8)                 │
│  ┌─────────────────────────────────────────────────┐│
│  │ HEADER (sticky top, bg white, shadow-sm)        ││
│  │ [PageTitle]              [Notificaciones] [CTA] ││
│  │ ─────────────────────────────────────────────── ││
│  │                                                 ││
│  │  PAGE CONTENT (p-8)                             ││
│  │                                                 ││
│  └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

**Responsive:**
- Desktop (≥1024px): Sidebar fijo visible.
- Tablet/Mobile (<1024px): Sidebar colapsado en hamburger menu + overlay drawer.

### 7.2 Componentes de UI (átomos)

Todos en `/components/ui/`:

```
Button         → variantes: primary (salvia), accent (naranja), ghost, outline, destructive
Input          → con label, helper text, error state
Select         → custom, con search opcional
Card           → surface blanco, rounded-xl, shadow-sm, padding-6
Badge          → success, warning, danger, info, neutral
Modal          → centered overlay, animated (framer-motion scale+opacity)
Skeleton       → loading placeholder animado
EmptyState     → ilustración SVG + título + subtítulo + CTA opcional
Tooltip        → ligero, sin librerías externas
PageHeader     → título (Playfair H2) + descripción + actions slot
KPICard        → icono + label + valor + variación porcentual
DataTable      → wrapper de TanStack Table con estilos Vensato
```

---

## 8. Integraciones Futuras (Roadmap)

### 8.1 Fincaraíz & Metrocuadrado
- **Estado:** Próximamente (badge en configuración)
- **Propósito:** Permitir publicar propiedades vacantes directamente desde Vensato.
- **Approach:** APIs de portales (si disponibles) o flujo manual asistido.

### 8.2 Wompi (Cobros automatizados)
- **Estado:** Plan Portafolio+
- **Flujo:**
  1. Usuario conecta su cuenta Wompi en `/configuracion`.
  2. Al generar un cobro, se crea un link de pago Wompi.
  3. El link se incluye en la cuenta de cobro PDF y el email.
  4. Webhook de Wompi actualiza el estado del cobro a `paid` automáticamente.

### 8.3 DIAN (Facturación electrónica)
- **Estado:** Plan Patrimonio — Próximamente
- **Propósito:** Generar facturas electrónicas válidas fiscalmente para arrendadores obligados.

### 8.4 WhatsApp Business (Recordatorios)
- **Estado:** Plan Patrimonio
- **Approach:** Twilio o WABA directa con templates aprobados.

---

## 9. Onboarding (Primera experiencia)

Al registrarse, el usuario pasa por un onboarding de 3 pasos antes de ver el dashboard:

```
Paso 1: "Cuéntanos sobre ti"
- Nombre completo, cédula.
- ¿Cuántas propiedades tienes? (ayuda a recomendar plan)

Paso 2: "Agrega tu primera propiedad"
- Formulario simplificado de propiedad (alias, dirección, canon).
- Opción de "Saltar por ahora".

Paso 3: "¡Listo para empezar!"
- Resumen del plan activo (Base).
- Checklist de primeros pasos: Agregar inquilino, Crear cobro, Subir contrato.
- Botón "Ir al dashboard".
```

El onboarding se muestra solo si `profiles.onboarding_completed = false`.

---

## 10. Principios de UX Específicos de la App

1. **Densidad informativa sin ruido:** Las tablas muestran exactamente lo necesario. Usar tooltips para detalles, no columnas adicionales.
2. **Acciones en contexto:** El botón más importante está siempre visible. No enterrar acciones en menús de 3 puntos a menos que sean acciones secundarias.
3. **Feedback inmediato:** Toda acción (guardar, borrar, enviar) tiene un estado de loading y un toast de confirmación o error.
4. **Números siempre formateados:** Todo valor en COP con `Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' })`. Nunca mostrar `35000`, siempre `$35.000`.
5. **Empty states motivadores:** La primera vez que un módulo está vacío, el empty state explica el valor del módulo y tiene un CTA de acción principal. No mostrar tablas vacías sin contexto.
6. **Errores honestos:** Los mensajes de error deben ser en español, específicos y accionables. No usar mensajes técnicos.

---

## 11. Checklist de Inicio de Construcción

- [ ] Inicializar proyecto Next.js 14 con TypeScript
- [ ] Configurar Tailwind + tokens de diseño en `tailwind.config.ts`
- [ ] Instalar y configurar fuentes (`Playfair Display` + `Plus Jakarta Sans`) con `next/font/google`
- [ ] Configurar Supabase (proyecto en supabase.com, variables de entorno)
- [ ] Ejecutar migraciones SQL (tablas + RLS)
- [ ] Implementar middleware de auth
- [ ] Construir layout de auth (`/login`, `/register`)
- [ ] Construir shell de la app (Sidebar + Header)
- [ ] Construir librería de componentes UI base (Button, Input, Card, Badge)
- [ ] Implementar módulo de Propiedades (CRUD completo)
- [ ] Implementar módulo de Inquilinos (CRUD completo)
- [ ] Implementar módulo de Cobros (CRUD + generación PDF)
- [ ] Implementar módulo de Contratos (CRUD + lógica IPC)
- [ ] Implementar Dashboard con KPIs y gráficos
- [ ] Implementar Bóveda Documental (upload/download Supabase Storage)
- [ ] Implementar Reportes (Cap Rate, NOI, gráficas)
- [ ] Implementar Configuración + Feature flags por plan
- [ ] Configurar Resend para emails transaccionales
- [ ] Onboarding de nuevos usuarios
- [ ] Configurar dominio `app.vensato.com` en Vercel

---

*Este documento es el cerebro de `app.vensato.com`. Toda decisión de producto, diseño e ingeniería debe ser coherente con los principios aquí definidos. Ante cualquier ambigüedad, referirse primero a este documento y — si no está cubierto — documentar la decisión antes de implementarla.*