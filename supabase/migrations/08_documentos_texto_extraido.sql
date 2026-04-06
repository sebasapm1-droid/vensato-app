ALTER TABLE public.documentos
  ADD COLUMN IF NOT EXISTS texto_extraido TEXT;

CREATE INDEX IF NOT EXISTS documentos_user_tipo_idx
  ON public.documentos(user_id, tipo);
