-- ─── Fase 1: Schema de suscripciones y tiers ─────────────────────────────────
-- Ejecutar en Supabase SQL Editor

-- ─── 1. profiles ──────────────────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'base'
    CHECK (tier IN ('base', 'inicio', 'portafolio', 'patrimonio')),
  ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'active'
    CHECK (subscription_status IN ('active', 'past_due', 'cancelled', 'trialing')),
  ADD COLUMN IF NOT EXISTS subscription_valid_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS wompi_customer_id TEXT;

-- ─── 2. properties ────────────────────────────────────────────────────────────
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS activa BOOLEAN DEFAULT TRUE;

-- ─── 3. tenants ───────────────────────────────────────────────────────────────
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS fecha_inicio_contrato DATE,
  ADD COLUMN IF NOT EXISTS fecha_fin_contrato DATE;

-- ─── 4. contracts ─────────────────────────────────────────────────────────────
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS r2_key TEXT;

-- ─── 5. charges ───────────────────────────────────────────────────────────────
ALTER TABLE public.charges
  ADD COLUMN IF NOT EXISTS wompi_transaction_id TEXT,
  ADD COLUMN IF NOT EXISTS wompi_payment_link TEXT,
  ADD COLUMN IF NOT EXISTS comprobante_r2_key TEXT;

-- ─── 6. ipc_history — habilitar RLS ──────────────────────────────────────────
ALTER TABLE public.ipc_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users can read ipc_history"
  ON public.ipc_history FOR SELECT TO authenticated USING (true);

-- ─── 7. subscriptions (nueva) ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tier                    TEXT NOT NULL CHECK (tier IN ('inicio', 'portafolio', 'patrimonio')),
  status                  TEXT NOT NULL CHECK (status IN ('active', 'past_due', 'cancelled')),
  billing_cycle           TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual')),
  amount_cop              INTEGER NOT NULL,
  wompi_subscription_id   TEXT,
  wompi_payment_source_id TEXT,
  current_period_start    TIMESTAMPTZ NOT NULL,
  current_period_end      TIMESTAMPTZ NOT NULL,
  cancelled_at            TIMESTAMPTZ,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can read own subscriptions"
  ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

-- ─── 8. workspace_members (nueva) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.workspace_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  member_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('viewer', 'editor', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(owner_id, member_id)
);

ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners can manage members"
  ON public.workspace_members USING (auth.uid() = owner_id);

CREATE POLICY "members can read their membership"
  ON public.workspace_members FOR SELECT USING (auth.uid() = member_id);

-- ─── 9. invitaciones (nueva) ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.invitaciones (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('viewer', 'editor', 'admin')),
  token       TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '48 hours',
  accepted_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 10. recordatorio_config (nueva) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.recordatorio_config (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  dias_anticipacion INTEGER DEFAULT 3,
  email_activo     BOOLEAN DEFAULT TRUE,
  whatsapp_activo  BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.recordatorio_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can manage own recordatorio_config"
  ON public.recordatorio_config USING (auth.uid() = user_id);

-- ─── 11. copropietarios (nueva) ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.copropietarios (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  nombre      TEXT NOT NULL,
  cedula      TEXT,
  email       TEXT,
  porcentaje  DECIMAL NOT NULL CHECK (porcentaje > 0 AND porcentaje <= 100),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.copropietarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can manage own copropietarios"
  ON public.copropietarios
  USING (
    property_id IN (
      SELECT id FROM public.properties WHERE user_id = auth.uid()
    )
  );
