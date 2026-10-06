# Multi-stage Hardened Dockerfile para Servicio FastAPI MLOps (HT-47 T02)
# Autor: Álvaro Tipián (MLOps & DevSecOps Leader)

FROM python:3.12-slim AS builder

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# --- Etapa Final de Producción (Hardened Container) ---
FROM python:3.12-slim AS runner

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PATH="/install/bin:$PATH"

# Copiar dependencias del builder
COPY --from=builder /install /install

# Crear usuario sin privilegios root (Seguridad Container DevSecOps)
RUN addgroup --gid 10001 appgroup && \
    adduser --uid 10001 --gid 10001 --disabled-password --gecos "" appuser && \
    chown -R appuser:appgroup /app

COPY --chown=appuser:appgroup . .

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
