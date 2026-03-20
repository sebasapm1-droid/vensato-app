ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pending_tier       TEXT CHECK (pending_tier IN ('base', 'inicio', 'portafolio', 'patrimonio')),
  ADD COLUMN IF NOT EXISTS pending_tier_since TIMESTAMPTZ;
