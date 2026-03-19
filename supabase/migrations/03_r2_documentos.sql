-- Tabla de documentos almacenados en Cloudflare R2.
-- Separada de la tabla `documents` existente (Supabase Storage).
-- propiedad_id referencia la tabla `properties` (nombre en inglés del esquema).

CREATE TABLE IF NOT EXISTS documentos (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  propiedad_id     UUID        REFERENCES properties(id) ON DELETE CASCADE,
  tipo             VARCHAR(50) NOT NULL CHECK (tipo IN ('contrato', 'foto', 'cedula', 'extracto', 'otro')),
  nombre_original  TEXT        NOT NULL,
  r2_key           TEXT        NOT NULL,           -- path dentro del bucket, ej. users/{uid}/contrato/{propId}/{ts}.pdf
  tamanio_bytes    INTEGER,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: cada usuario solo ve y modifica sus propios documentos
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven sus propios documentos"
  ON documentos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuarios crean sus propios documentos"
  ON documentos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios eliminan sus propios documentos"
  ON documentos FOR DELETE
  USING (auth.uid() = user_id);

-- Índices útiles para queries frecuentes
CREATE INDEX IF NOT EXISTS documentos_user_id_idx        ON documentos (user_id);
CREATE INDEX IF NOT EXISTS documentos_propiedad_id_idx   ON documentos (propiedad_id);
