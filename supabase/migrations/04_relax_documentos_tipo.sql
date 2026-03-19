-- El CHECK original limita tipo a 5 valores fijos,
-- pero la UI maneja más categorías (escritura, predial, poliza, etc.).
-- Removemos el constraint para aceptar cualquier etiqueta de tipo.

ALTER TABLE documentos DROP CONSTRAINT IF EXISTS documentos_tipo_check;
