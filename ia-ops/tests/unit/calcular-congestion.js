function calcularCongestion(velocidadActual, velocidadNormal) {
  if (velocidadNormal === 0) {
    return { porcentajeCongestion: 0, estado: 'Sin datos' };
  }
  const congestion = ((velocidadNormal - velocidadActual) / velocidadNormal) * 100;
  return {
    porcentajeCongestion: Number(congestion.toFixed(1)),
    estado: congestion > 30 ? 'Congestionado' : 'Fluido'
  };
}

module.exports = { calcularCongestion };