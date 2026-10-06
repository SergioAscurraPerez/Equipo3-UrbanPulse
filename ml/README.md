# Dataset de riesgo vial — HT-46

## Unidad de análisis
zona × franja × día de la semana.

**Zona = punto de monitoreo de TomTom** (`puntos_monitoreo`), no celda de 1 km
ni distrito puro. Se decidió así porque los puntos de monitoreo ya traen
congestión (TomTom) y permiten un join espacial directo con los siniestros
de ONSV (que sí tienen lat/lon). Se agrega `distrito` como columna de
referencia (moda de los siniestros asignados a cada zona), pero no es la
unidad de agregación. Decisión comunicada a Patrick el [fecha].

## Fuentes usadas
- `siniestros_fatales` (ONSV, filtrado a Lima): siniestros, severidad, tipo de vía.
- `traffic_readings` (TomTom): congestión media por zona × franja.
- `reports` (reportes ciudadanos): conteo de reportes en los últimos 30 días.

## Fuente excluida
- `siniestros_sutran`: sin geocodificar (0/8079 filas con `geom` al
  05/10/2026 — verificado con `SELECT count(*), count(geom) FROM siniestros_sutran`).
  Convertir KILOMETRO + CODIGO_VIA a lat/lon requiere referenciación lineal
  sobre la Red Vial Nacional del MTC; queda como mejora pendiente, no
  asignada en este sprint.

## Columnas del dataset
| Columna | Descripción |
|---|---|
| zona_id | Nombre del punto de monitoreo (TomTom) |
| distrito | Distrito más frecuente entre los siniestros de esa zona |
| franja | manana / tarde / noche |
| dia_semana | 0=lunes … 6=domingo |
| siniestros_12m | Conteo de siniestros en la ventana móvil de 12 meses |
| severidad_media | Promedio de (fallecidos + lesionados) por siniestro |
| congestion_media | % de congestión promedio TomTom en esa zona×franja |
| reportes_30d | Reportes ciudadanos cerca de la zona en los últimos 30 días |
| tipo_via_frecuente | Moda del tipo de vía |
| nivel_riesgo | bajo / medio / alto (terciles calculados sobre train) |
| semana_corte | Semana de referencia del snapshot |

## Reproducibilidad
`python ml/data/build_dataset.py --fecha-corte YYYY-MM-DD` — con la misma
fecha de corte, el hash SHA-256 del parquet resultante es idéntico.