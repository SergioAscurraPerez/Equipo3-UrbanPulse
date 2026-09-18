import { X, Flame, Navigation, Users, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function MapHelpModal({ abierto, onCerrar }) {
  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl shadow-2xl p-5 text-[var(--color-text-primary)]">
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-orange-500/10 text-orange-500">
              <Flame size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base">Guía de Lectura del Mapa</h3>
              <p className="text-xs text-[var(--color-text-secondary)]">UrbanPulse — Monitoreo Vial Urbano</p>
            </div>
          </div>
          <button
            onClick={onCerrar}
            className="p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border)]/30 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Contenido */}
        <div className="mt-4 space-y-4 text-xs leading-relaxed">
          {/* Sección 1: El Mapa de Calor (HU-06) */}
          <div className="p-3.5 rounded-xl bg-gradient-to-br from-orange-500/10 via-red-500/5 to-transparent border border-orange-500/20">
            <h4 className="font-bold text-sm text-orange-400 flex items-center gap-1.5">
              <Flame size={15} />
              ¿Qué es y qué muestra el Mapa de Calor?
            </h4>
            <p className="mt-1 text-[var(--color-text-secondary)]">
              Representa la <strong className="text-[var(--color-text-primary)]">densidad histórica de accidentes y siniestros viales</strong> (datos de SUTRAN y ONSV). En lugar de saturar la vista con cientos de pines, agrupa las zonas de mayor peligro mediante un degradado térmico continuo.
            </p>

            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-600 shrink-0"></span>
                <div>
                  <strong className="text-[var(--color-text-primary)]">Zona Roja / Carmesí (Punto Crítico):</strong>
                  <span className="text-[var(--color-text-secondary)]"> Cruces y tramos de alta velocidad donde ocurren choques múltiples y atropellos graves recurrentes.</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-orange-500 shrink-0"></span>
                <div>
                  <strong className="text-[var(--color-text-primary)]">Zona Naranja (Riesgo Moderado):</strong>
                  <span className="text-[var(--color-text-secondary)]"> Avenidas o intersecciones conflictivas con siniestros periódicos.</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-yellow-300 shrink-0"></span>
                <div>
                  <strong className="text-[var(--color-text-primary)]">Zona Amarilla (Riesgo Leve):</strong>
                  <span className="text-[var(--color-text-secondary)]"> Registro bajo o incidentes esporádicos.</span>
                </div>
              </div>
            </div>

            <p className="mt-2.5 text-[10px] text-[var(--color-text-secondary)] italic border-t border-orange-500/10 pt-2">
              💡 <strong>Diferencia clave:</strong> Las líneas del mapa miden el tráfico vehicular en vivo; el calor térmico mide la peligrosidad física acumulada para prevenir accidentes.
            </p>
          </div>

          {/* Sección 2: Capas Activas */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--color-text-secondary)]">
              Capas Disponibles
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-app)]/50">
                <div className="flex items-center gap-1.5 font-semibold text-[11px] text-blue-400">
                  <Users size={14} />
                  <span>Reportes Ciudadanos</span>
                </div>
                <p className="text-[10px] text-[var(--color-text-secondary)] mt-1">
                  Puntos circulares con alertas en tiempo real sobre baches, semáforos caídos y obras.
                </p>
              </div>

              <div className="p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-app)]/50">
                <div className="flex items-center gap-1.5 font-semibold text-[11px] text-emerald-400">
                  <Navigation size={14} />
                  <span>Flujo de Tráfico</span>
                </div>
                <p className="text-[10px] text-[var(--color-text-secondary)] mt-1">
                  Líneas dinámicas de TomTom: verde (despejado), naranja (congestión) y rojo oscuro (detenido).
                </p>
              </div>

              <div className="p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-app)]/50">
                <div className="flex items-center gap-1.5 font-semibold text-[11px] text-amber-400">
                  <AlertTriangle size={14} />
                  <span>Siniestros SUTRAN</span>
                </div>
                <p className="text-[10px] text-[var(--color-text-secondary)] mt-1">
                  Alertas viales mayores, cierres de vía y desvíos reportados en carreteras y avenidas.
                </p>
              </div>

              <div className="p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-app)]/50">
                <div className="flex items-center gap-1.5 font-semibold text-[11px] text-purple-400">
                  <ShieldCheck size={14} />
                  <span>Prioridades P1 a P5</span>
                </div>
                <p className="text-[10px] text-[var(--color-text-secondary)] mt-1">
                  Clasificación de urgencia operativa: desde P1 (peligro inminente) hasta P5 (mantenimiento).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Botón de cierre */}
        <div className="mt-5 pt-3 border-t border-[var(--color-border)] flex justify-end">
          <button
            onClick={onCerrar}
            className="px-4 py-2 rounded-xl bg-[var(--color-accent)] text-white font-semibold text-xs hover:opacity-90 transition-opacity"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}