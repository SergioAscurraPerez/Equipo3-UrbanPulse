CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'operador',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
