import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Loader2,
  AlertTriangle,
  Search,
  RefreshCw,
  MapPin,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { getSession } from './session';
import './index.css';

const N8N_BASE =
  'https://urbanpulse-n8n.xq33kajky1yy6.us-east-1.cs.amazonlightsail.com/webhook';

const COLORES_TIPO = {
  infraestructura_vial: '#F59E0B',
  alumbrado_publico: '#EAB308',
  agua_saneamiento: '#3B82F6',
  residuos: '#84CC16',
  arbolado_urbano: '#22C55E',
  incendio: '#EF4444',
  otro: '#A1A1AA',
};

const ETIQUETAS_TIPO = {
  infraestructura_vial: 'Infraestructura vial',
  alumbrado_publico: 'Alumbrado público',
  agua_saneamiento: 'Agua y saneamiento',
  residuos: 'Residuos',
  arbolado_urbano: 'Arbolado urbano',
  incendio: 'Incendio',
  otro: 'Otro',
};

const COLORES_SEVERIDAD = {
  alta: 'text-red-400 border-red-500/30 bg-red-500/10',
  media: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  baja: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
};

// Configuración visual por estado
const CONFIG_ESTADO = {
  resuelto: {
    etiqueta: 'Resuelto',
    bordeLateral: 'bg-emerald-500',
    badge: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    icono: CheckCircle2,
  },
  en_proceso: {
    etiqueta: 'En proceso',
    bordeLateral: 'bg-blue-500',
    badge: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
    icono: Loader2,
    spin: true,
  },
  pendiente: {
    etiqueta: 'Pendiente',
    bordeLateral: 'bg-amber-500',
    badge: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    icono: Clock,
  },
};

function normalizarEstado(status) {
  const s = String(status || '').trim().toLowerCase().replace(/ /g, '_');
  if (s === 'resuelto') return 'resuelto';
  if (s === 'en_proceso' || s === 'enproceso') return 'en_proceso';
  return 'pendiente';
}

function normalizarLista(datos) {
  if (Array.isArray(datos)) return datos;
  return datos && datos.id ? [datos] : [];
}

export default function HistorialView({ session: sesionProp }) {
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  const usuarioId = (sesionProp || getSession() || {}).id || null;

  // React Query con auto-sincronización y revalidación automática
  const {
    data: reportes = [],
    isLoading: cargando,
    isFetching: refrescando,
    error: errorQuery,
    refetch,
  } = useQuery({
    queryKey: ['historial-reportes', usuarioId],
    queryFn: async () => {
      if (!usuarioId) {
        throw new Error('Inicia sesión para ver tu historial de reportes.');
      }

      const urlBase =
        import.meta.env.VITE_N8N_REPORTS_HISTORY_URL ||
        `${N8N_BASE}/urbanpulse/reports-history`;

      const respuesta = await fetch(
        `${urlBase}?usuario_id=${encodeURIComponent(usuarioId)}`
      );

      if (!respuesta.ok) {
        throw new Error(`El servidor respondió ${respuesta.status}`);
      }

      const texto = await respuesta.text();
      if (!texto) return [];

      let json;
      try {
        json = JSON.parse(texto);
      } catch {
        json = [];
      }

      return normalizarLista(json);
    },
    enabled: !!usuarioId,
    staleTime: 5 * 1000, // Se mantiene fresco por 5 segundos antes de revalidar en segundo plano
    refetchOnWindowFocus: true, // Actualiza automáticamente al volver a la pestaña
  });

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return reportes.filter((r) => {
      const st = normalizarEstado(r.status);

      if (filtroEstado !== 'todos' && st !== filtroEstado) {
        return false;
      }

      if (!texto) return true;

      return [
        r.description,
        ETIQUETAS_TIPO[r.incident_type],
        r.incident_type,
        r.severity,
        r.reportado_por,
      ].some((campo) => (campo || '').toLowerCase().includes(texto));
    });
  }, [reportes, busqueda, filtroEstado]);

  const totales = useMemo(() => {
    const counts = { todos: reportes.length, pendientes: 0, en_proceso: 0, resueltos: 0 };
    reportes.forEach((r) => {
      const st = normalizarEstado(r.status);
      if (st === 'resuelto') counts.resueltos++;
      else if (st === 'en_proceso') counts.en_proceso++;
      else counts.pendientes++;
    });
    return counts;
  }, [reportes]);

  return (
    <div className="w-full h-full overflow-y-auto p-6 md:p-10 bg-[var(--color-bg-app)] text-[var(--color-text-primary)] transition-colors duration-200">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* ENCABEZADO */}
        <div className="pb-5 border-b border-[var(--color-border)]">
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
                Historial de Reportes
              </h2>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                Haz seguimiento en tiempo real a los incidentes que has registrado.
              </p>
            </div>

            <button
              onClick={() => refetch()}
              disabled={refrescando}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-accent)]/50 transition-all duration-200 disabled:opacity-50 shrink-0 shadow-sm"
            >
              <RefreshCw
                size={16}
                className={refrescando ? 'animate-spin' : ''}
              />
              <span>Actualizar</span>
            </button>
          </div>
        </div>

        {/* BÚSQUEDA Y FILTROS */}
        <div className="space-y-3">
          {/* BUSCADOR */}
          <div className="w-full h-12 flex items-center gap-3 px-4 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] transition-all duration-200 focus-within:border-[var(--color-accent)] shadow-sm">
            <Search
              size={18}
              className="shrink-0 text-[var(--color-text-secondary)]"
            />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por descripción, tipo o severidad..."
              className="w-full h-full bg-transparent border-0 outline-none text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)]"
            />
          </div>

          {/* SELECTORES DE FILTRO (Tus estilos originales con los colores corregidos) */}
          <div className="flex items-center justify-end overflow-x-auto py-1">
            <div className="inline-flex items-center gap-1.5 p-1.5 bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] shadow-sm">
              {[
                { valor: 'todos', etiqueta: 'Todos', total: totales.todos },
                { valor: 'pendiente', etiqueta: 'Pendientes', total: totales.pendientes },
                { valor: 'en_proceso', etiqueta: 'En Proceso', total: totales.en_proceso },
                { valor: 'resuelto', etiqueta: 'Resueltos', total: totales.resueltos },
              ].map(({ valor, etiqueta, total }) => {
                const activo = filtroEstado === valor;

                return (
                  <button
                    key={valor}
                    type="button"
                    onClick={() => setFiltroEstado(valor)}
                    style={activo ? { backgroundColor: '#9333ea' } : undefined}
                    className={`
                      relative inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold
                      transition-all duration-200 cursor-pointer select-none whitespace-nowrap
                      ${
                        activo
                          ? '!bg-purple-600 text-white shadow-md shadow-purple-500/25 scale-[1.02]'
                          : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-app)]'
                      }
                    `}
                  >
                    <span>{etiqueta}</span>
                    
                    {/* Badge numérico */}
                    <span
                      style={activo ? { backgroundColor: 'rgba(0, 0, 0, 0.2)' } : undefined}
                      className={`
                        text-[11px] font-bold px-2 py-0.5 rounded-lg tabular-nums leading-none
                        ${
                          activo
                            ? '!bg-black/20 text-white'
                            : 'bg-[var(--color-bg-app)] text-[var(--color-text-secondary)] border border-[var(--color-border)]'
                        }
                      `}
                    >
                      {total}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* MENSAJE DE ERROR */}
        {errorQuery && (
          <div className="flex items-center gap-3 text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
            <AlertTriangle size={18} className="shrink-0" />
            <span>{errorQuery.message || 'No se pudo cargar el historial.'}</span>
          </div>
        )}

        {/* ESTADO DE CARGA */}
        {cargando && reportes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-[var(--color-accent)]">
            <Loader2 size={32} className="animate-spin mb-3" />
            <p className="text-sm text-[var(--color-text-secondary)]">
              Sincronizando historial de reportes...
            </p>
          </div>
        )}

        {/* ESTADO VACÍO */}
        {!cargando && filtrados.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4 bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-bg-app)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-secondary)] mb-3">
              <Search size={20} />
            </div>
            <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">
              {reportes.length === 0
                ? 'No tienes reportes registrados'
                : 'Sin coincidencias'}
            </p>
            <p className="text-xs text-[var(--color-text-secondary)] max-w-xs">
              {reportes.length === 0
                ? 'Empieza a reportar incidentes conversando con el agente de IA en el chat.'
                : 'Prueba ajustando los términos de búsqueda o cambiando el filtro seleccionado.'}
            </p>
          </div>
        )}

        {/* LISTA DE TARJETAS */}
        <div className="space-y-3">
          {filtrados.map((reporte) => {
            const st = normalizarEstado(reporte.status);
            const cfg = CONFIG_ESTADO[st];
            const IconoEstado = cfg.icono;

            const tipo = COLORES_TIPO[reporte.incident_type]
              ? reporte.incident_type
              : 'otro';

            return (
              <article
                key={reporte.id}
                className="group bg-[var(--color-card)] border border-[var(--color-border)] hover:border-[var(--color-accent)]/50 rounded-xl p-5 transition-all duration-200 shadow-sm relative overflow-hidden"
              >
                {/* INDICADOR LATERAL DE ESTADO */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1.5 ${cfg.bordeLateral}`}
                />

                <div className="flex flex-col gap-2.5">
                  {/* TIPO + SEVERIDAD + ESTADO */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: COLORES_TIPO[tipo] }}
                      />
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)]">
                        {ETIQUETAS_TIPO[tipo]}
                      </span>

                      {reporte.severity && (
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase ${
                            COLORES_SEVERIDAD[reporte.severity] ||
                            'text-[var(--color-text-secondary)] border-[var(--color-border)]'
                          }`}
                        >
                          {reporte.severity}
                        </span>
                      )}
                    </div>

                    {/* BADGE DE ESTADO */}
                    <span
                      className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border uppercase ${cfg.badge}`}
                    >
                      <IconoEstado size={11} className={cfg.spin ? 'animate-spin' : ''} />
                      {cfg.etiqueta}
                    </span>
                  </div>

                  {/* DESCRIPCIÓN */}
                  <p className="text-sm text-[var(--color-text-primary)] leading-relaxed break-words bg-[var(--color-bg-app)]/40 p-3 rounded-lg border border-[var(--color-border)]/40">
                    {reporte.description || 'Sin descripción detallada.'}
                  </p>

                  {/* METADATOS */}
                  <div className="flex items-center gap-3 flex-wrap text-xs text-[var(--color-text-secondary)] pt-1">
                    {reporte.reportado_por && (
                      <span>
                        Reportado por:{' '}
                        <strong className="text-[var(--color-text-primary)]">
                          {reporte.reportado_por}
                        </strong>
                      </span>
                    )}

                    {reporte.priority != null && (
                      <span>
                        Prioridad:{' '}
                        <strong className="text-[var(--color-text-primary)]">
                          {reporte.priority}
                        </strong>
                      </span>
                    )}

                    {reporte.latitude && reporte.longitude && (
                      <span className="flex items-center gap-1 text-emerald-400 font-medium">
                        <MapPin size={12} />
                        Ubicación exacta
                      </span>
                    )}

                    {reporte.created_at && (
                      <span className="ml-auto text-[11px] opacity-75">
                        {new Date(reporte.created_at).toLocaleString('es-PE', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

      </div>
    </div>
  );
}