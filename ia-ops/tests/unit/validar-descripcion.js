function validarDescripcion(description) {
  const esValida = typeof description === 'string' && description.trim().length > 0;
  if (!esValida) {
    return { valido: false, error: 'La descripción del incidente es obligatoria.' };
  }
  return { valido: true };
}

module.exports = { validarDescripcion };