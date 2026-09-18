import { useState} from 'react';
import { INCIDENT_COLORS, INCIDENT_LABELS } from './incidentColors';
import { ChevronDown, ChevronUp, Palette, Ban, Hash, Clock, Flame } from 'lucide-react';

const PRIORIDADES = [
  { nivel: 'P1 - Crítica', color: '#DC2626', desc: 'Atención inmediata / Peligro inminente' },
  { nivel: 'P2 - Alta', color: '#EF4444', desc: 'Riesgo alto / Vía troncal' },
  { nivel: 'P3 - Media', color: '#F59E0B', desc: 'Atención programada' },
  { nivel: 'P4 - Baja', color: '#10B981', desc: 'Rutinaria / Daño leve' },
  { nivel: 'P5 - Muy Baja', color: '#6B7280', desc: 'Mantenimiento / Desgaste' },
];

const NIVELES_CALOR = [
  { color: '#DC2626', nivel: 'Rojo / Carmesí', desc: 'Punto crítico: alta concentración de accidentes fatales y choques graves' },
  { color: '#F97316', nivel: 'Naranja', desc: 'Riesgo medio: intersecciones conflictivas con siniestros recurrentes' },
  { color: '#EAB308', nivel: 'Amarillo', desc: 'Riesgo leve: siniestros aislados o de baja frecuencia' },
];

const SIMBOLOGIA_VIAL = [
  {
    tipo: 'linea',
    color: '#22C55E',
    titulo: 'Tráfico fluido',
    desc: 'Velocidad normal de circulación',
  },
  {
    tipo: 'linea',
    color: '#F59E0B',
    titulo: 'Congestión moderada',
    desc: 'Flujo vehicular lento',
  },
  {
    tipo: 'linea',
    color: '#991B1B',
    titulo: 'Tráfico pesado / Detenido',
    desc: 'Cuello de botella o cola vehicular',
  },
  {
    tipo: 'icono',
    icono: Ban,
    color: 'text-red-500',
    titulo: 'Vía cerrada / Bloqueada',
    desc: 'Desvío, siniestro u obra TomTom/SUTRAN',
  },
  {
    tipo: 'icono',
    icono: Clock,
    color: 'text-amber-400',
    titulo: 'Retraso (+min / PE-1N)',
    desc: 'Minutos de retraso estimado o código de carretera',
  },
  {
    tipo: 'icono',
    icono: Hash,
    color: 'text-purple-400',
    titulo: 'Contadores en capas',
    desc: 'Total de reportes activos en la ciudad',
  },
];

export default function MapLegend({ conteos = {}, tipoActivo, onSeleccionarTipo }) {
  const [colapsado, setColapsado] = useState(false);
  const [pestana, setPestana] = useState('tipo'); // 'tipo' | 'prioridad' | 'calor' | 'simbolos'

  return (
    <div className="absolute bottom-4 left-4 z-10 w-[calc(100%-2rem)] sm:w-80 max-w-sm bg-[var(--color-card)]/95 border border-[var(--color-border)] rounded-2xl p-3 text-xs backdrop-blur-md shadow-xl transition-all">
      <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-1.5 font-bold text-[var(--color-text-primary)]">
          <Palette size={14} className="text-[var(--color-accent)]" />
          <span>Leyenda y Guía</span>
        </div>
        <div className="flex items-center gap-1">
          {tipoActivo && pestana === 'tipo' && (
            <button
              onClick={() => onSeleccionarTipo(null)}
              className="text-[10px] text-[var(--color-accent-light)] hover:underline mr-1"
            >
              Reset
            </button>
          )}
          <button
            onClick={() => setColapsado(!colapsado)}
            className="p-1 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            title={colapsado ? 'Expandir leyenda' : 'Colapsar leyenda'}
          >
            {colapsado ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {!colapsado && (
        <>
          {/* Selector de Pestañas */}
          <div className="grid grid-cols-4 gap-1 my-2 p-0.5 bg-[var(--color-bg-app)] rounded-lg border border-[var(--color-border)]">
            <button
              onClick={() => setPestana('tipo')}
              className={`py-1 rounded-md text-[10px] font-semibold transition-all ${
                pestana === 'tipo'
                  ? 'bg-[var(--color-card)] text-[var(--color-accent-light)] shadow-sm'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              Tipo
            </button>
            <button
              onClick={() => setPestana('prioridad')}
              className={`py-1 rounded-md text-[10px] font-semibold transition-all ${
                pestana === 'prioridad'
                  ? 'bg-[var(--color-card)] text-[var(--color-accent-light)] shadow-sm'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              Prioridad
            </button>
            <button
              onClick={() => setPestana('calor')}
              className={`py-1 rounded-md text-[10px] font-semibold transition-all ${
                pestana === 'calor'
                  ? 'bg-[var(--color-card)] text-orange-500 shadow-sm'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              Calor
            </button>
            <button
              onClick={() => setPestana('simbolos')}
              className={`py-1 rounded-md text-[10px] font-semibold transition-all ${
                pestana === 'simbolos'
                  ? 'bg-[var(--color-card)] text-[var(--color-accent-light)] shadow-sm'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              Tráfico
            </button>
          </div>

          {/* 1. Vista por Tipo de Incidente */}
          {pestana === 'tipo' && (
            <ul className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {Object.entries(INCIDENT_COLORS).map(([tipo, color]) => {
                const activo = tipoActivo === tipo;
                const cantidad = conteos[tipo] || 0;

                return (
                  <li key={tipo}>
                    <button
                      onClick={() => onSeleccionarTipo(activo ? null : tipo)}
                      className={`w-full flex items-center gap-2 px-2 py-1 rounded-lg text-left transition-colors ${
                        activo
                          ? 'bg-[var(--color-accent)]/15 text-[var(--color-text-primary)] font-bold'
                          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]/30'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }}></span>
                      <span className="flex-1 truncate text-[11px]">{INCIDENT_LABELS[tipo] || tipo}</span>
                      <span className="tabular-nums text-[10px] opacity-75">{cantidad}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {/* 2. Vista por Prioridad (P1 a P5) */}
          {pestana === 'prioridad' && (
            <ul className="space-y-2 py-1 max-h-48 overflow-y-auto pr-1">
              {PRIORIDADES.map((p) => (
                <li key={p.nivel} className="flex items-center justify-between text-[11px] gap-2">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }}></span>
                    <span className="font-semibold text-[var(--color-text-primary)]">{p.nivel}</span>
                  </div>
                  <span className="text-[10px] text-[var(--color-text-secondary)] truncate">{p.desc}</span>
                </li>
              ))}
            </ul>
          )}

          {/* 3. Vista de Mapa de Calor de Siniestros (HU-06) */}
          {pestana === 'calor' && (
            <div className="py-1 space-y-2.5 max-h-48 overflow-y-auto pr-1">
              <div>
                <p className="text-[11px] font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
                  <Flame size={13} className="text-orange-500" />
                  Densidad de Siniestros Viales
                </p>
                <p className="text-[10px] text-[var(--color-text-secondary)] mt-0.5 leading-snug">
                  Muestra la concentración histórica de accidentes graves y puntos ciegos de la ciudad.
                </p>
              </div>

              {/* Barra de degradado térmico */}
              <div className="space-y-1">
                <div className="h-2.5 w-full rounded-full bg-gradient-to-r from-yellow-200 via-amber-400 via-orange-500 to-red-600 shadow-inner"></div>
                <div className="flex justify-between text-[9px] text-[var(--color-text-secondary)] font-semibold">
                  <span>Riesgo Leve</span>
                  <span>Riesgo Medio</span>
                  <span>Punto Crítico</span>
                </div>
              </div>

              <ul className="space-y-1.5 pt-1 border-t border-[var(--color-border)]/50">
                {NIVELES_CALOR.map((n, i) => (
                  <li key={i} className="flex items-start gap-2 text-[10px]">
                    <span className="w-2 h-2 rounded-full mt-1 shrink-0" style={{ backgroundColor: n.color }}></span>
                    <div>
                      <span className="font-bold text-[var(--color-text-primary)]">{n.nivel}: </span>
                      <span className="text-[var(--color-text-secondary)]">{n.desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 4. Vista de Simbología Vial y Tráfico */}
          {pestana === 'simbolos' && (
            <ul className="space-y-2 py-1 max-h-48 overflow-y-auto pr-1">
              {SIMBOLOGIA_VIAL.map((item, index) => {
                const Icono = item.icono;
                return (
                  <li key={index} className="flex items-start gap-2.5 text-[11px]">
                    <div className="mt-1 shrink-0">
                      {item.tipo === 'linea' && (
                        <span className="block w-4 h-1.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                      )}
                      {item.tipo === 'icono' && <Icono size={14} className={item.color} />}
                    </div>
                    <div>
                      <p className="font-bold leading-none text-[var(--color-text-primary)]">{item.titulo}</p>
                      <p className="text-[10px] text-[var(--color-text-secondary)] mt-0.5 leading-tight">{item.desc}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}