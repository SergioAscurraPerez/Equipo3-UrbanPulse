// Un color por cada valor real del enum incident_type que devuelve el clasificador (Gemini/Groq).
// El morado de acento (#A855F7) queda reservado para la UI, no para codificar datos.
export const INCIDENT_COLORS = {
  infraestructura_vial: '#F59E0B',
  alumbrado_publico: '#EAB308',
  agua_saneamiento: '#3B82F6',
  residuos: '#84CC16',
  arbolado_urbano: '#22C55E',
  incendio: '#EF4444',
  otro: '#A1A1AA',
};

export const INCIDENT_LABELS = {
  infraestructura_vial: 'Infraestructura vial',
  alumbrado_publico: 'Alumbrado público',
  agua_saneamiento: 'Agua y saneamiento',
  residuos: 'Residuos',
  arbolado_urbano: 'Arbolado urbano',
  incendio: 'Incendio',
  otro: 'Otro',
};
