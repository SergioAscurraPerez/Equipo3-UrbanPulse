import { useState} from 'react';
import { Layers, ChevronDown, ChevronUp, Flame, Users, AlertTriangle, Navigation } from 'lucide-react';

export default function MapLayerControl({ capas, onToggleCapa, totales = {} }) {
  const [abierto, setAbierto] = useState(true);

  return (
    <div className="absolute top-4 right-4 z-10 w-64 bg-[var(--color-card)]/95 border border-[var(--color-border)] rounded-2xl p-3 text-xs backdrop-blur-md shadow-xl transition-all">
      <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-1.5 font-bold text-[var(--color-text-primary)]">
          <Layers size={15} className="text-[var(--color-accent)]" />
          <span>Control de Capas</span>
        </div>
        <button
          onClick={() => setAbierto(!abierto)}
          className="p-1 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          {abierto ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {abierto && (
        <div className="mt-3 space-y-2.5">
          {/* Capa Mapa de Calor de Siniestralidad (HU-06) */}
          <label className="flex items-center justify-between p-1.5 rounded-xl hover:bg-[var(--color-border)]/20 cursor-pointer transition-colors">
            <div className="flex items-center gap-2 text-[var(--color-text-primary)]">
              <Flame size={15} className="text-orange-500" />
              <div className="flex flex-col">
                <span className="font-semibold text-[11px]">Calor de Siniestros</span>
                <span className="text-[9px] text-[var(--color-text-secondary)]">Densidad vial crítica</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={!!capas.mapaCalor}
              onChange={() => onToggleCapa('mapaCalor')}
              className="accent-[var(--color-accent)] w-4 h-4 cursor-pointer rounded"
            />
          </label>

          {/* Capa Reportes Ciudadanos */}
          <label className="flex items-center justify-between p-1.5 rounded-xl hover:bg-[var(--color-border)]/20 cursor-pointer transition-colors">
            <div className="flex items-center gap-2 text-[var(--color-text-primary)]">
              <Users size={15} className="text-blue-500" />
              <div className="flex flex-col">
                <span className="font-semibold text-[11px]">Reportes Ciudadanos</span>
                <span className="text-[9px] text-[var(--color-text-secondary)]">Incidentes en vivo</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded-full font-bold">
                {totales.ciudadanos || 0}
              </span>
              <input
                type="checkbox"
                checked={!!capas.reportesCiudadanos}
                onChange={() => onToggleCapa('reportesCiudadanos')}
                className="accent-[var(--color-accent)] w-4 h-4 cursor-pointer rounded"
              />
            </div>
          </label>

          {/* Capa Tráfico TomTom */}
          <label className="flex items-center justify-between p-1.5 rounded-xl hover:bg-[var(--color-border)]/20 cursor-pointer transition-colors">
            <div className="flex items-center gap-2 text-[var(--color-text-primary)]">
              <Navigation size={15} className="text-emerald-500" />
              <div className="flex flex-col">
                <span className="font-semibold text-[11px]">Flujo de Tráfico</span>
                <span className="text-[9px] text-[var(--color-text-secondary)]">Congestión TomTom</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={!!capas.traficoTomTom}
              onChange={() => onToggleCapa('traficoTomTom')}
              className="accent-[var(--color-accent)] w-4 h-4 cursor-pointer rounded"
            />
          </label>

          {/* Capa Siniestros SUTRAN */}
          <label className="flex items-center justify-between p-1.5 rounded-xl hover:bg-[var(--color-border)]/20 cursor-pointer transition-colors">
            <div className="flex items-center gap-2 text-[var(--color-text-primary)]">
              <AlertTriangle size={15} className="text-amber-500" />
              <div className="flex flex-col">
                <span className="font-semibold text-[11px]">Incidentes Viales</span>
                <span className="text-[9px] text-[var(--color-text-secondary)]">SUTRAN / Obras</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={!!capas.siniestrosSutran}
              onChange={() => onToggleCapa('siniestrosSutran')}
              className="accent-[var(--color-accent)] w-4 h-4 cursor-pointer rounded"
            />
          </label>
        </div>
      )}
    </div>
  );
}