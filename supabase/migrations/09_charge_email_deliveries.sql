CREATE TABLE IF NOT EXISTS public.charge_email_deliveries (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  charge_id           UUID NOT NULL REFERENCES public.charges(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tenant_id           UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  provider            TEXT NOT NULL DEFAULT 'resend',
  provider_message_id TEXT,
  trigger             TEXT NOT NULL CHECK (trigger IN ('manual', 'automatic')),
  status              TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'skipped')),
  recipient_email     TEXT NOT NULL,
  subject             TEXT NOT NULL,
  error_message       TEXT,
  sent_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS charge_email_deliveries_charge_idx
  ON public.charge_email_deliveries(charge_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS charge_email_deliveries_user_trigger_idx
  ON public.charge_email_deliveries(user_id, trigger, sent_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS charge_email_deliveries_auto_sent_unique
  ON public.charge_email_deliveries(charge_id)
  WHERE trigger = 'automatic' AND status = 'sent';
