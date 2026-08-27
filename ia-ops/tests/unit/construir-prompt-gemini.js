function construirPromptGemini(description, trafico, imageBase64) {
  const contextoTrafico = (trafico && trafico.nombre)
    ? `Dato de tráfico cercano: ${trafico.nombre}, ${trafico.porcentaje_congestion}% de congestión (${trafico.estado}).`
    : 'No hay datos de tráfico cercano disponibles.';

  const parts = [
    {
      text: `Eres un asistente de UrbanPulse que clasifica reportes ciudadanos de incidentes urbanos en Lima, Perú.
Descripción: "${description}"
${contextoTrafico}`
    }
  ];

  if (imageBase64) {
    parts.push({
      inline_data: { mime_type: 'image/jpeg', data: imageBase64 }
    });
  }

  return { contents: [{ parts }] };
}

module.exports = { construirPromptGemini };