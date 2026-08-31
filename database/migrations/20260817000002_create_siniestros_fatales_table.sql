CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS siniestros_fatales (
    codigo_siniestro TEXT PRIMARY KEY,
    fecha_iso DATE,
    hora_siniestro TEXT,
    clase_siniestro TEXT,
    fallecidos INT,
    lesionados INT,
    vehiculos_danados INT,
    departamento TEXT,
    provincia TEXT,
    distrito TEXT,
    zona TEXT,
    tipo_via TEXT,
    red_vial TEXT,
    cod_carretera TEXT,
    latitud DOUBLE PRECISION,
    longitud DOUBLE PRECISION,
    condicion_climatica TEXT,
    zonificacion TEXT,
    caracteristicas_via TEXT,
    perfil_longitudinal_via TEXT,
    superficie_calzada TEXT,
    existe_senal_vertical TEXT,
    clasificacion_senal_vertical_1 TEXT,
    clasificacion_senal_vertical_2 TEXT,
    existe_senal_horizontal TEXT,
    causa_factor_principal TEXT,
    causa_especifica TEXT,
    geom GEOMETRY(Point, 4326),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_siniestros_geom ON siniestros_fatales USING GIST (geom);