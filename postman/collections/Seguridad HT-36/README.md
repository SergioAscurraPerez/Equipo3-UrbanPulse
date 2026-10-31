# Seguridad HT-36 (T07)

Pruebas negativas de seguridad de los webhooks n8n. Cada caso comprueba una defensa de HT-36.

| # | Caso | Esperado | Depende de |
|---|---|---|---|
| 01 | `GET reports-history` sin token | `401 token_invalido` | HT-36 T01 |
| 02 | `GET reports-history` con la firma alterada | `401 token_invalido` | HT-36 T01 |
| 03 | `POST report-resolve` con token de ciudadano | `403 rol_no_permitido` | HT-36 T01 |
| 04 | `GET reports-list` con `Origin` ajeno | no devuelve el origen ajeno ni `*` | HT-36 T02 |
| 05 | `POST auth/forgot` | sin `reset_url` ni `reset_token` | HT-36 T04 |

El caso 05 falla mientras `/auth/forgot` devuelva el enlace en la respuesta. Es intencional: se pone en verde cuando T04 llega a staging.

## Variables del entorno de staging

Usa `postman/environments/urbanpulse-seguridad-staging.postman_environment.example.json` como plantilla. Copia el archivo, quítale `.example` y complétalo: los `*.postman_environment.json` están en `.gitignore`.

| Variable | Valor |
|---|---|
| `base_url` | Base del n8n de staging, sin `/` final |
| `token_ciudadano` | Token del login de un **ciudadano** de staging (secret). Caduca a las 12 h |
| `correo_prueba` | Correo de una cuenta de prueba, para `/auth/forgot` |
| `origin_ajeno` | `https://atacante.example` |

## Ejecución

```bash
newman run "postman/collections/Seguridad HT-36/urbanpulse-seguridad-ht36.postman_collection.json" \
  -e postman/environments/urbanpulse-seguridad-staging.postman_environment.json
```

También está como **Etapa 7** de `postman/collections/urbanpulse-regresion.postman_collection.json` (la usa HT-37 T02): `--folder "Etapa 7 - Seguridad HT-36 (requiere base_url y token_ciudadano)"`.

## Escaneo ZAP

`.zap/urbanpulse-api.openapi.yaml` declara el esquema `bearerAuth`. El API scan de `dast-owasp-zap.yml` envía el token del secret `DAST_API_TOKEN` (operador de staging) en cada petición.
