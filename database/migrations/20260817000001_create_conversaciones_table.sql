CREATE TABLE IF NOT EXISTS conversaciones (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'inicio',
    descripcion TEXT,
    imagen_base64 TEXT,
    imagen_consistente BOOLEAN,
    observacion_imagen TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    historial_mensajes JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);