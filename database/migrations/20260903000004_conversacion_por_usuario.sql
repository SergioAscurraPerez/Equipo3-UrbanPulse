-- La conversación del chat no guardaba de quién era: se identificaba solo por
-- session_id, que el navegador armaba con la hora en milisegundos. Dos
-- personas que abrieran el chat en el mismo instante caían en la misma fila y
-- se pisaban el reporte a medio armar.
ALTER TABLE conversaciones
ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES usuarios (id);

CREATE INDEX IF NOT EXISTS idx_conversaciones_usuario_id
ON conversaciones (usuario_id);

-- El flujo de n8n ya usaba esta columna para recordar que el ciudadano dijo no
-- tener foto, pero ninguna migración la creaba: una base levantada desde cero
-- se quedaba sin ella.
ALTER TABLE conversaciones
ADD COLUMN IF NOT EXISTS imagen_omitida BOOLEAN NOT NULL DEFAULT false;
