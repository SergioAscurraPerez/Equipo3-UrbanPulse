import { INCIDENT_COLORS, INCIDENT_LABELS } from './incidentColors';

export default function MapLegend({ conteos = {}, tipoActivo, onSeleccionarTipo }) {
  return (
    <div className="absolute bottom-4 left-4 z-10 bg-[var(--color-card)]/90 border border-[var(--color-border)] rounded-xl p-3 text-xs backdrop-blur-sm max-w-[220px]">
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="font-bold text-[var(--color-text-primary)]">Tipo de incidente</p>
        {tipoActivo && (
          <button
            onClick={() => onSeleccionarTipo(null)}
            className="text-[10px] text-[var(--color-accent-light)] hover:underline shrink-0"
          >
            Ver todos
          </button>
        )}
      </div>

      <ul className="space-y-1">
        {Object.entries(INCIDENT_COLORS).map(([tipo, color]) => {
          const activo = tipoActivo === tipo;
          const cantidad = conteos[tipo] || 0;

          return (
            <li key={tipo}>
              <button
                onClick={() => onSeleccionarTipo(activo ? null : tipo)}
                className={`w-full flex items-center gap-2 px-1.5 py-1 rounded-md text-left transition-colors ${
                  activo
                    ? 'bg-[var(--color-accent)]/15 text-[var(--color-text-primary)]'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]/40'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }}></span>
                <span className="flex-1 truncate">{INCIDENT_LABELS[tipo] || tipo}</span>
                <span className="tabular-nums opacity-70">{cantidad}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
