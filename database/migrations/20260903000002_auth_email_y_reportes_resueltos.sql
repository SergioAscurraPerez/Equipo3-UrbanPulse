-- Email como identificador de acceso.
-- A los usuarios existentes se les asigna un email temporal en vez de borrarlos,
-- porque reports.usuario_id los referencia; deberán registrarse con su email real.
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS email TEXT;

UPDATE usuarios
SET email = username || '@pendiente.local'
WHERE email IS NULL;

ALTER TABLE usuarios
ALTER COLUMN email SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_email
ON usuarios (email);

-- Recuperación de contraseña
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS reset_token TEXT;

ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS reset_token_expira TIMESTAMPTZ;

-- Marcado de reportes como resueltos
ALTER TABLE reports
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_reports_status
ON reports (status);
