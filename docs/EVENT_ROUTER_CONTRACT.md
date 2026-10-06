# Contrato y Especificación del Enrutador de Eventos (HT-51 T02)

**Autor:** Álvaro Tipián (MLOps & DevSecOps Leader)  
**Fecha:** 05/10/2026  
**Endpoint:** `POST /urbanpulse/eventos`  
**n8n Production URL:** `https://urbanpulse-n8n.xq33kajky1yy6.us-east-1.cs.amazonlightsail.com/webhook/urbanpulse/eventos`  
**n8n Staging URL:** `https://urbanpulse-n8n-staging.xq33kajky1yy6.us-east-1.cs.amazonlightsail.com/webhook/urbanpulse/eventos`

---

## 0. Autenticación

El webhook usa **Header Auth** de n8n. Toda petición debe enviar:

- **Header:** `X-Event-Token`
- **Credencial en n8n:** `UrbanPulse Event Router Header Auth` (tipo Header Auth; Name = `X-Event-Token`, Value = token generado por el equipo).
- **Secret en GitHub (para quien emite eventos desde Actions):** `EVENT_ROUTER_TOKEN`.

Sin el header o con un token inválido, n8n responde 403 y el evento no se persiste. No incluir el valor del token en el código ni en este documento.

---

## 1. Sobre Común de Eventos (Envelope Specification)

Todo evento enviado a `POST /urbanpulse/eventos` debe cumplir con el siguiente esquema JSON:

```json
{
  "id": "6f1c2a9e-3b7d-4e2a-9c51-0d8f2b7a1e44",
  "tipo": "reporte.creado",
  "fecha": "2026-10-06T15:02:11-05:00",
  "origen": "n8n/central-vr5",
  "datos": {
    "reporte_id": 1842,
    "distrito": "Miraflores",
    "franja": "tarde",
    "tipo_incidente": "choque"
  }
}
```

### Reglas de Validación y Respuestas:
1. **Idempotencia (`id`):** Debe ser un string en formato **UUID v4**. La base de datos ejecuta `INSERT ... ON CONFLICT (id) DO NOTHING`.
2. **Tipos de Eventos Soportados (`tipo`):**
   - `reporte.creado`
   - `reporte.estado_cambiado`
   - `n8n.flujo_fallido`
   - `modelo.deriva_detectada`
3. **Respuesta Exitosos:** HTTP `202 Accepted`
   ```json
   {
     "estado": "recibido",
     "id": "6f1c2a9e-3b7d-4e2a-9c51-0d8f2b7a1e44",
     "tipo": "reporte.creado",
     "timestamp": "2026-10-05T20:13:00.000Z"
   }
   ```
4. **Respuesta Evento Inválido:** HTTP `400 Bad Request`
   ```json
   {
     "error": "Validación de sobre o datos fallida",
     "detalle": "El campo \"id\" debe ser un UUID v4 válido."
   }
   ```
