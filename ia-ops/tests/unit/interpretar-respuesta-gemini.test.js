const { interpretarRespuestaGemini } = require('./interpretar-respuesta-gemini');

describe('interpretarRespuestaGemini', () => {
  const respuestaValida = {
    candidates: [{
      content: {
        parts: [{
          text: JSON.stringify({
            incident_type: 'infraestructura_vial',
            severity: 'alta',
            priority: 4,
            mensaje_ciudadano: 'Hemos recibido tu reporte.'
          })
        }]
      }
    }]
  };
  const bodyOriginal = { description: 'Bache enorme', latitude: -12.04, longitude: -77.04 };

  test('extrae correctamente los campos de una respuesta valida', () => {
    const resultado = interpretarRespuestaGemini(respuestaValida, bodyOriginal);
    expect(resultado.ok).toBe(true);
    expect(resultado.incident_type).toBe('infraestructura_vial');
    expect(resultado.priority).toBe(4);
  });

  test('devuelve latitude/longitude null si no vienen en el body', () => {
    const resultado = interpretarRespuestaGemini(respuestaValida, { description: 'Bache' });
    expect(resultado.latitude).toBeNull();
    expect(resultado.longitude).toBeNull();
  });

  test('maneja sin excepcion una respuesta malformada (JSON invalido)', () => {
    const respuestaRota = { candidates: [{ content: { parts: [{ text: 'esto no es JSON' }] } }] };
    expect(() => interpretarRespuestaGemini(respuestaRota, bodyOriginal)).not.toThrow();
    const resultado = interpretarRespuestaGemini(respuestaRota, bodyOriginal);
    expect(resultado.ok).toBe(false);
  });

  test('maneja sin excepcion una respuesta con estructura inesperada (candidates vacio)', () => {
    const respuestaVacia = { candidates: [] };
    expect(() => interpretarRespuestaGemini(respuestaVacia, bodyOriginal)).not.toThrow();
    const resultado = interpretarRespuestaGemini(respuestaVacia, bodyOriginal);
    expect(resultado.ok).toBe(false);
  });
});