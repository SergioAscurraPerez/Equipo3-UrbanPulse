import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle, RotateCcw, Loader2, AlertTriangle, Search, RefreshCw, MapPin } from 'lucide-react';

const N8N_BASE = 'https://urbanpulse-n8n.xq33kajky1yy6.us-east-1.cs.amazonlightsail.com/webhook';

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
  alta: 'text-red-400 border-red-400/40 bg-red-400/10',
  media: 'text-amber-400 border-amber-400/40 bg-amber-400/10',
  baja: 'text-emerald-400 border-emerald-400/40 bg-emerald-400/10',
};

function normalizarLista(datos) {
  // n8n (responseMode: lastNode) devuelve un objeto suelto si hay una sola fila
  if (Array.isArray(datos)) return datos;
  return datos && datos.id ? [datos] : [];
}

export default function HistorialView() {
  const [reportes, setReportes] = useState([]);
  const [estado, setEstado] = useState('cargando');
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [guardandoId, setGuardandoId] = useState(null);

  const pedirHistorial = useCallback(async () => {
    const url = import.meta.env.TE_N8N_REPORTS_HISTORY_URL || `${N8N_BASE}/urbanpulse/reports-history`;
    const respuesta = await fetch(url);
    if (!respuesta.ok) throw new Error(`El servidor respondió ${respuesta.status}`);
    const texto = await respuesta.text();
    return normalizarLista(texto ? JSON.parse(texto) : []);
  }, []);

  useEffect(() => {
    let activo = true;

    pedirHistorial()
      .then((lista) => {
        if (!activo) return;
        setReportes(lista);
        setEstado('listo');
      })
      .catch((err) => {
        if (!activo) return;
        setError(err.message || 'No se pudo cargar el historial.');
        setEstado('error');
      });

    return () => { activo = false; };
  }, [pedirHistorial]);

  const recargar = () => {
    setEstado('cargando');
    setError(null);
    pedirHistorial()
      .then((lista) => { setReportes(lista); setEstado('listo'); })
      .catch((err) => { setError(err.message || 'No se pudo cargar el historial.'); setEstado('error'); });
  };

  const cambiarEstadoReporte = async (reporte, nuevoEstado) => {
    setGuardandoId(reporte.id);
    try {
      const url = import.meta.env.TE_N8N_REPORT_RESOLVE_URL || `${N8N_BASE}/urbanpulse/report-resolve`;
      const respuesta = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: reporte.id, status: nuevoEstado }),
      });

      if (!respuesta.ok) throw new Error(`El servidor respondió ${respuesta.status}`);

      setReportes((previos) =>
        previos.map((r) =>
          r.id === reporte.id
            ? { ...r, status: nuevoEstado, resolved_at: nuevoEstado === 'resuelto' ? new Date().toISOString() : null }
            : r
        )
      );
    } catch (err) {
      setError(`No se pudo actualizar el reporte: ${err.message}`);
    } finally {
      setGuardandoId(null);
    }
  };

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return reportes.filter((r) => {
      const resuelto = r.status === 'resuelto';
      if (filtroEstado === 'pendientes' && resuelto) return false;
      if (filtroEstado === 'resueltos' && !resuelto) return false;
      if (!texto) return true;

      return [r.description, ETIQUETAS_TIPO[r.incident_type], r.incident_type, r.severity, r.reportado_por]
        .some((campo) => (campo || '').toLowerCase().includes(texto));
    });
  }, [reportes, busqueda, filtroEstado]);

  const totales = useMemo(() => ({
    todos: reportes.length,
    pendientes: reportes.filter((r) => r.status !== 'resuelto').length,
    resueltos: reportes.filter((r) => r.status === 'resuelto').length,
  }), [reportes]);

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Historial de reportes</h2>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Todos los incidentes registrados, con o sin ubicación.
            </p>
          </div>
          <button
            onClick={recargar}
            disabled={estado === 'cargando'}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-accent-light)] transition-colors disabled:opacity-50 shrink-0"
          >
            <RefreshCw size={16} className={estado === 'cargando' ? 'animate-spin' : ''} />
            <span className="text-sm font-medium">Actualizar</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por descripción, tipo o quien reportó..."
              className="w-full bg-[var(--color-card)] text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] pl-9 pr-4 py-2.5 rounded-xl border border-[var(--color-border)] text-sm focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
            />
          </div>
          <div className="flex bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-1">
            {[
              { valor: 'todos', etiqueta: `Todos (${totales.todos})` },
              { valor: 'pendientes', etiqueta: `Pendientes (${totales.pendientes})` },
              { valor: 'resueltos', etiqueta: `Resueltos (${totales.resueltos})` },
            ].map(({ valor, etiqueta }) => (
              <button
                key={valor}
                onClick={() => setFiltroEstado(valor)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filtroEstado === valor
                    ? 'bg-[var(--color-accent)] text-white'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-accent-light)]'
                }`}
              >
                {etiqueta}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/30 rounded-xl px-4 py-3">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {estado === 'cargando' && reportes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-[var(--color-accent)]">
            <Loader2 size={32} className="animate-spin mb-4" />
            <p className="text-[var(--color-text-secondary)]">Cargando historial...</p>
          </div>
        )}

        {estado === 'listo' && filtrados.length === 0 && (
          <p className="text-center text-[var(--color-text-secondary)] py-20">
            No hay reportes que coincidan con el filtro.
          </p>
        )}

        <div className="space-y-3">
          {filtrados.map((reporte) => {
            const resuelto = reporte.status === 'resuelto';
            const tipo = COLORES_TIPO[reporte.incident_type] ? reporte.incident_type : 'otro';

            return (
              <article
                key={reporte.id}
                className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORES_TIPO[tipo] }}></span>
                      <span className="text-sm font-bold text-[var(--color-text-primary)]">
                        {ETIQUETAS_TIPO[tipo]}
                      </span>
                      {reporte.severity && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${COLORES_SEVERIDAD[reporte.severity] || 'text-[var(--color-text-secondary)] border-[var(--color-border)]'}`}>
                          {reporte.severity}
                        </span>
                      )}
                      {resuelto && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full border text-emerald-400 border-emerald-400/40 bg-emerald-400/10">
                          resuelto
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-[var(--color-text-primary)] mb-2 break-words">
                      {reporte.description || 'Sin descripción'}
                    </p>

                    <div className="flex items-center gap-3 flex-wrap text-xs text-[var(--color-text-secondary)]">
                      {reporte.reportado_por && <span>Reportado por {reporte.reportado_por}</span>}
                      {reporte.priority != null && <span>Prioridad {reporte.priority}</span>}
                      {reporte.latitude && reporte.longitude && (
                        <span className="flex items-center gap-1">
                          <MapPin size={11} /> con ubicación
                        </span>
                      )}
                      {reporte.created_at && <span>{new Date(reporte.created_at).toLocaleString()}</span>}
                    </div>
                  </div>

                  <button
                    onClick={() => cambiarEstadoReporte(reporte, resuelto ? 'pending' : 'resuelto')}
                    disabled={guardandoId === reporte.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-colors shrink-0 disabled:opacity-50 ${
                      resuelto
                        ? 'bg-[var(--color-bg-app)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-accent-light)]'
                        : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25'
                    }`}
                  >
                    {guardandoId === reporte.id
                      ? <Loader2 size={14} className="animate-spin" />
                      : (resuelto ? <RotateCcw size={14} /> : <CheckCircle size={14} />)}
                    <span>{resuelto ? 'Reabrir' : 'Marcar resuelto'}</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
