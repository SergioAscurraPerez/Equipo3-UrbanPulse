function interpretarRespuestaGemini(respuestaGemini, bodyOriginal) {
  try {
    const texto = respuestaGemini.candidates[0].content.parts[0].text;
    const clasificacion = JSON.parse(texto);

    return {
      ok: true,
      description: bodyOriginal.description,
      incident_type: clasificacion.incident_type,
      severity: clasificacion.severity,
      priority: clasificacion.priority,
      mensaje_ciudadano: clasificacion.mensaje_ciudadano,
      latitude: bodyOriginal.latitude ?? null,
      longitude: bodyOriginal.longitude ?? null
    };
  } catch (error) {
    return { ok: false, error: 'No se pudo interpretar la respuesta del modelo.' };
  }
}

module.exports = { interpretarRespuestaGemini };