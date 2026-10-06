# 📊 Contrato del Webhook: Estado de la Plataforma (HU-13 T01)

**Endpoint:** `GET /urbanpulse/estado-plataforma`  
**Autor:** Álvaro Tipián (MLOps & DevSecOps Leader)  
**Tiempos de Respuesta Objetivo:** < 3000 ms (SLA < 3s)  

---

## 📋 Descripción
Este webhook centraliza el monitoreo en tiempo real de toda la infraestructura de la plataforma UrbanPulse reuniendo:
1. Pruebas de salud (`/healthz` de n8n, `/health` de FastAPI, y consulta `SELECT 1` en Neon PostgreSQL).
2. Estado de monitoreo del modelo MLOps (F1-Score y flag de Data Drift).
3. Métrica de cumplimiento SLA y tickets abiertos en Jira Service Desk (API REST Jira).

## 📤 Estructura de Respuesta JSON (200 OK)
```json
{
  "estado_plataforma": "OPERATIVO",
  "timestamp": "2026-10-02T20:55:00Z",
  "version": "1.0.0",
  "servicios": [
    { "nombre": "n8n_engine", "estado": "ONLINE", "latencia_ms": 45 },
    { "nombre": "fastapi_mlops", "estado": "ONLINE", "latencia_ms": 22 },
    { "nombre": "neon_postgres", "estado": "ONLINE", "latencia_ms": 18 }
  ],
  "monitoreo_modelo": {
    "modelo": "urbanpulse_risk_classifier",
    "version": "v1.0.0",
    "f1_score": 0.941,
    "deriva_detectada": false
  },
  "service_desk_jira": {
    "tickets_abiertos": 2,
    "cumplimiento_sla_porcentaje": 98.5,
    "portal_url": "https://urbanpulse-ti.atlassian.net"
  }
}
```
