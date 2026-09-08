const { calcularCongestion } = require('./calcular-congestion');

describe('calcularCongestion', () => {
  test.each([
    [60, 60, 0, 'Fluido'],
    [30, 60, 50, 'Congestionado'],
    [42, 60, 30, 'Fluido'],        // caso límite: exactamente 30%
    [70, 60, -16.7, 'Fluido'],     // más rápido de lo normal
  ])('velocidad %i de %i normal => %i%% (%s)', (actual, normal, esperado, estadoEsperado) => {
    const resultado = calcularCongestion(actual, normal);
    expect(resultado.porcentajeCongestion).toBeCloseTo(esperado, 1);
    expect(resultado.estado).toBe(estadoEsperado);
  });

  test('no lanza excepcion cuando la velocidad normal es 0', () => {
    expect(() => calcularCongestion(10, 0)).not.toThrow();
    const resultado = calcularCongestion(10, 0);
    expect(resultado.estado).toBe('Sin datos');
  });
});