ALTER TABLE reports
ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES usuarios (id);

CREATE INDEX IF NOT EXISTS idx_reports_usuario_id
ON reports (usuario_id);
