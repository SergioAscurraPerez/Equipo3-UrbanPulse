const { validarDescripcion } = require('./validar-descripcion');

describe('validarDescripcion', () => {
  test.each([
    [''],
    [null],
    [undefined],
    ['   '],   // solo espacios en blanco
  ])('rechaza descripcion invalida: %p', (valor) => {
    const resultado = validarDescripcion(valor);
    expect(resultado.valido).toBe(false);
    expect(resultado.error).toBe('La descripción del incidente es obligatoria.');
  });

  test('acepta una descripcion valida', () => {
    const resultado = validarDescripcion('Hay un bache enorme');
    expect(resultado.valido).toBe(true);
    expect(resultado.error).toBeUndefined();
  });
});