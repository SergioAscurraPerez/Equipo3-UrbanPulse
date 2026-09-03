const LABELS = {
  infraestructura_vial: 'Infraestructura vial',
  alumbrado_publico: 'Alumbrado público',
  agua_saneamiento: 'Agua y saneamiento',
  residuos: 'Residuos',
  arbolado_urbano: 'Arbolado urbano',
  incendio: 'Incendio',
  otro: 'Otro',
};

export default function MapLegend({ colors }) {
  return (
    <div className="absolute bottom-4 left-4 z-10 bg-[var(--color-card)]/90 border border-[var(--color-border)] rounded-xl p-3 text-xs backdrop-blur-sm max-w-[200px]">
      <p className="font-bold text-[var(--color-text-primary)] mb-2">Tipo de incidente</p>
      <ul className="space-y-1.5">
        {Object.entries(colors).map(([type, color]) => (
          <li key={type} className="flex items-center gap-2 text-[var(--color-text-secondary)]">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }}></span>
            {LABELS[type] || type}
          </li>
        ))}
      </ul>
    </div>
  );
}
