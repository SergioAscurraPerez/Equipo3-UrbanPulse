const { construirPromptGemini } = require('./construir-prompt-gemini');

describe('construirPromptGemini', () => {
  test('incluye la descripcion del ciudadano', () => {
    const resultado = construirPromptGemini('Hay un bache enorme', null, null);
    expect(resultado.contents[0].parts[0].text).toContain('Hay un bache enorme');
  });

  test('usa el mensaje por defecto cuando no hay datos de trafico', () => {
    const resultado = construirPromptGemini('Bache', null, null);
    expect(resultado.contents[0].parts[0].text).toContain('No hay datos de tráfico cercano disponibles.');
  });

  test('incluye el dato de trafico cuando existe', () => {
    const trafico = { nombre: 'San Isidro', porcentaje_congestion: 45, estado: 'Congestionado' };
    const resultado = construirPromptGemini('Bache', trafico, null);
    expect(resultado.contents[0].parts[0].text).toContain('San Isidro');
    expect(resultado.contents[0].parts[0].text).toContain('45');
  });

  test('agrega la imagen como segunda parte cuando existe', () => {
    const resultado = construirPromptGemini('Bache', null, 'BASE64FALSO');
    expect(resultado.contents[0].parts).toHaveLength(2);
    expect(resultado.contents[0].parts[1].inline_data.data).toBe('BASE64FALSO');
  });

  test('NO agrega segunda parte cuando no hay imagen', () => {
    const resultado = construirPromptGemini('Bache', null, null);
    expect(resultado.contents[0].parts).toHaveLength(1);
  });
});