-- NOTA: aquí originalmente había un `ALTER ROLE CURRENT_USER CONNECTION
-- LIMIT 20;`. Cambiar el CONNECTION LIMIT de un rol requiere ser
-- superusuario o tener CREATEROLE, y ningún rol de proyecto en Neon lo es
-- (ni lo expone como ajuste por rol vía consola): correrlo falla con
-- "permission denied to alter role" (SQLSTATE 42501). El máximo real de
-- conexiones lo fija el tamaño del compute de Neon, y para picos de
-- consultas simultáneas la vía soportada es su pooler integrado (PgBouncer),
-- usando el endpoint `-pooler` de la connection string en la credencial
-- Postgres que usa n8n en producción (ver nota en .env.example).

-- Todos los workflows de n8n (chat, reportes, KPIs del dashboard, mapa) y los
-- scripts de verificación comparten un mismo rol de conexión a Neon. Una
-- consulta lenta o una transacción que un workflow deja abierta por error
-- retenía su conexión indefinidamente, reduciendo aún más el cupo disponible
-- para el resto. Estos timeouts liberan la conexión automáticamente.
ALTER ROLE CURRENT_USER SET statement_timeout = '30s';
ALTER ROLE CURRENT_USER SET idle_in_transaction_session_timeout = '15s';
