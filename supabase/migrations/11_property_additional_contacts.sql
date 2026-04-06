ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS additional_contacts JSONB NOT NULL DEFAULT '[]'::jsonb;
