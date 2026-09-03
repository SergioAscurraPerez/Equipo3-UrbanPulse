import { useCallback, useEffect, useState } from 'react';
import { Sun, Moon, MapPin, Wifi, WifiOff, Loader2, LogOut, User, RefreshCw } from 'lucide-react';

const N8N_BASE = 'https://urbanpulse-n8n.xq33kajky1yy6.us-east-1.cs.amazonlightsail.com/webhook';
const SESION_CIUDADANO = 'urbanpulse_citizen_session';

function leerSesionCiudadano() {
  try {
    const raw = localStorage.getItem(SESION_CIUDADANO);
    if (!raw) return null;
    const sesion = JSON.parse(raw);
    if (!sesion.expires_at || new Date(sesion.expires_at).getTime() <= Date.now()) return null;
    return sesion;
  } catch {
    return null;
  }
}

function Seccion({ titulo, descripcion, children }) {
  return (
    <section className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl p-6">
      <h3 className="text-base font-bold text-[var(--color-text-primary)]">{titulo}</h3>
      {descripcion && (
        <p className="text-sm text-[var(--color-text-secondary)] mt-1 mb-4">{descripcion}</p>
      )}
      <div className={descripcion ? '' : 'mt-4'}>{children}</div>
    </section>
  );
}

function Dato({ etiqueta, valor }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-[var(--color-border)] last:border-b-0">
      <span className="text-sm text-[var(--color-text-secondary)] shrink-0">{etiqueta}</span>
      <span className="text-sm text-[var(--color-text-primary)] text-right break-all">{valor}</span>
    </div>
  );
}

export default function AjustesView({ theme, onCambiarTema }) {
  const [sesion, setSesion] = useState(leerSesionCiudadano);
  const [estadoN8n, setEstadoN8n] = useState('comprobando');
  const [permisoUbicacion, setPermisoUbicacion] = useState('desconocido');

  const comprobarN8n = useCallback(async () => {
    const url = import.meta.env.TE_N8N_REPORTS_LIST_URL || `${N8N_BASE}/urbanpulse/reports-list`;
    const respuesta = await fetch(url);
    if (!respuesta.ok) throw new Error(String(respuesta.status));
    return true;
  }, []);

  useEffect(() => {
    let activo = true;

    comprobarN8n()
      .then(() => { if (activo) setEstadoN8n('conectado'); })
      .catch(() => { if (activo) setEstadoN8n('sin-conexion'); });

    return () => { activo = false; };
  }, [comprobarN8n]);

  useEffect(() => {
    let activo = true;

    if (!navigator.permissions) {
      return undefined;
    }

    navigator.permissions
      .query({ name: 'geolocation' })
      .then((resultado) => { if (activo) setPermisoUbicacion(resultado.state); })
      .catch(() => { if (activo) setPermisoUbicacion('desconocido'); });

    return () => { activo = false; };
  }, []);

  const revisarConexion = () => {
    setEstadoN8n('comprobando');
    comprobarN8n()
      .then(() => setEstadoN8n('conectado'))
      .catch(() => setEstadoN8n('sin-conexion'));
  };

  const cerrarSesionCiudadano = () => {
    try {
      localStorage.removeItem(SESION_CIUDADANO);
    } catch {
      // localStorage no disponible
    }
    setSesion(null);
  };

  const etiquetaPermiso = {
    granted: 'Concedido',
    denied: 'Denegado — los reportes usarán coordenadas de respaldo',
    prompt: 'Se pedirá al enviar un reporte',
    desconocido: 'No disponible en este navegador',
  }[permisoUbicacion] || permisoUbicacion;

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Ajustes</h2>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Preferencias de la aplicación y estado de los servicios.
          </p>
        </div>

        <Seccion titulo="Apariencia" descripcion="Se aplica a todas las secciones y se recuerda en este navegador.">
          <div className="grid grid-cols-2 gap-3">
            {[
              { valor: 'dark', etiqueta: 'Oscuro', icono: Moon },
              { valor: 'light', etiqueta: 'Claro', icono: Sun },
            ].map(({ valor, etiqueta, icono: Icono }) => (
              <button
                key={valor}
                onClick={() => onCambiarTema(valor)}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-colors ${
                  theme === valor
                    ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]'
                    : 'bg-[var(--color-bg-app)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:text-[var(--color-accent-light)]'
                }`}
              >
                <Icono size={18} />
                <span className="text-sm font-medium">{etiqueta}</span>
              </button>
            ))}
          </div>
        </Seccion>

        <Seccion titulo="Cuenta del chat" descripcion="Sesión usada para reportar incidentes y vincularlos a tu usuario.">
          {sesion ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--color-bg-app)] border border-[var(--color-border)] text-[var(--color-accent)]">
                  <User size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[var(--color-text-primary)] truncate">
                    {sesion.email || sesion.username}
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)]">{sesion.role || 'ciudadano'}</p>
                </div>
              </div>
              <Dato
                etiqueta="La sesión expira"
                valor={sesion.expires_at ? new Date(sesion.expires_at).toLocaleString() : '—'}
              />
              <button
                onClick={cerrarSesionCiudadano}
                className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-bg-app)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-red-400 transition-colors"
              >
                <LogOut size={16} />
                <span className="text-sm font-medium">Cerrar sesión</span>
              </button>
            </>
          ) : (
            <p className="text-sm text-[var(--color-text-secondary)]">
              No has iniciado sesión. Entra a la pestaña <strong className="text-[var(--color-text-primary)]">Chat</strong> para
              iniciar sesión o registrarte.
            </p>
          )}
        </Seccion>

        <Seccion titulo="Estado de los servicios">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {estadoN8n === 'comprobando' && <Loader2 size={18} className="animate-spin text-[var(--color-accent)]" />}
              {estadoN8n === 'conectado' && <Wifi size={18} className="text-emerald-400" />}
              {estadoN8n === 'sin-conexion' && <WifiOff size={18} className="text-red-400" />}
              <div>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">Servidor n8n</p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {estadoN8n === 'comprobando' && 'Comprobando conexión...'}
                  {estadoN8n === 'conectado' && 'Respondiendo correctamente'}
                  {estadoN8n === 'sin-conexion' && 'No responde — revisa que los workflows estén activos'}
                </p>
              </div>
            </div>
            <button
              onClick={revisarConexion}
              disabled={estadoN8n === 'comprobando'}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--color-bg-app)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-accent-light)] transition-colors disabled:opacity-50 shrink-0"
            >
              <RefreshCw size={14} className={estadoN8n === 'comprobando' ? 'animate-spin' : ''} />
              <span className="text-sm">Revisar</span>
            </button>
          </div>

          <div className="mt-4">
            <div className="flex items-center gap-3">
              <MapPin size={18} className="text-[var(--color-accent-light)]" />
              <div>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">Permiso de ubicación</p>
                <p className="text-xs text-[var(--color-text-secondary)]">{etiquetaPermiso}</p>
              </div>
            </div>
          </div>
        </Seccion>

        <Seccion titulo="Conexiones configuradas" descripcion="Si una variable no está definida en Vercel, se usa la URL de respaldo del código.">
          <Dato etiqueta="Chat (n8n)" valor={import.meta.env.TE_N8N_WEBHOOK_URL || `${N8N_BASE}/urbanpulse/chat`} />
          <Dato etiqueta="KPIs del dashboard" valor={import.meta.env.TE_N8N_DASHBOARD_KPIS_URL || `${N8N_BASE}/urbanpulse/dashboard-kpis`} />
          <Dato etiqueta="Reportes del mapa" valor={import.meta.env.TE_N8N_REPORTS_LIST_URL || `${N8N_BASE}/urbanpulse/reports-list`} />
          <Dato etiqueta="Inicio de sesión" valor={import.meta.env.TE_N8N_AUTH_LOGIN_URL || `${N8N_BASE}/urbanpulse/auth/login`} />
        </Seccion>
      </div>
    </div>
  );
}
