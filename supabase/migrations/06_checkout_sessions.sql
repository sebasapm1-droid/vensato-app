-- ─── 1. checkout_sessions ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.checkout_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tier              TEXT NOT NULL CHECK (tier IN ('inicio', 'portafolio', 'patrimonio')),
  payment_link_id   TEXT NOT NULL UNIQUE,
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.checkout_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can read own checkout sessions"
  ON public.checkout_sessions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- ─── 2. Columnas de pago recurrente en profiles ────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS wompi_payment_token      TEXT,
  ADD COLUMN IF NOT EXISTS wompi_payment_token_at   TIMESTAMPTZ;

-- wompi_customer_id ya no se usará como sesión de checkout;
-- lo dejamos para compatibilidad pero lo limpiamos conceptualmente.
