-- El reporte no guardaba ninguna referencia a la conversación que lo originó,
-- pese a que es en conversaciones donde queda la imagen que envió el ciudadano.
ALTER TABLE reports
ADD COLUMN IF NOT EXISTS session_id VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_reports_session_id
ON reports (session_id);

-- Recuperación de las imágenes ya existentes.
-- Al completar un reporte el flujo solo marca la conversación como
-- 'completado': nunca borra imagen_base64. Esas fotos siguen guardadas y se
-- pueden emparejar por descripción y coordenadas, que es exactamente lo que el
-- flujo copió al crear el reporte.
UPDATE reports AS r
SET
    session_id = c.session_id,
    image_url = COALESCE(
        r.image_url,
        CASE
            WHEN c.imagen_base64 IS NOT NULL
                THEN 'data:image/jpeg;base64,' || c.imagen_base64
        END
    )
FROM conversaciones AS c
WHERE
    r.session_id IS NULL
    AND c.descripcion IS NOT NULL
    AND c.descripcion = r.description
    AND c.latitude IS NOT DISTINCT FROM r.latitude
    AND c.longitude IS NOT DISTINCT FROM r.longitude;
