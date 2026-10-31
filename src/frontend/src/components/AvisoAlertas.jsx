// HU-10 / T04: aviso en el host para el ciudadano
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, MapPin, X } from 'lucide-react';
import { getSession } from '@urbanpulse/shared';
import {
  useAlertasCercanas,
  useDescartarAlerta,
  useCompartirUbicacion,
  leerConsentimiento,
  guardarConsentimiento,
} from '../hooks/useAlertasCercanas';

const esCiudadano = (s) => String(s?.rol || s?.role || '').toLowerCase() === 'ciudadano';

const formatoDistancia = (m) => (m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`);

// Dos pitidos cortos con Web Audio (sin archivo de audio)
const sonarAlerta = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const t0 = ctx.currentTime;
    const DURACION = 1.8; // segundos
    const CICLOS = 3;     // sube y baja 3 veces

    const osc = ctx.createOscillator();
    const vol = ctx.createGain();
    // Compresor: permite subir el volumen sin que distorsione
    const comp = ctx.createDynamicsCompressor();

    osc.type = 'sawtooth'; // más áspero y penetrante que 'sine'

    // Barrido de tono tipo sirena: 650 Hz ↔ 1300 Hz
    const paso = DURACION / CICLOS;
    for (let i = 0; i < CICLOS; i++) {
      osc.frequency.setValueAtTime(650, t0 + i * paso);
      osc.frequency.linearRampToValueAtTime(1300, t0 + i * paso + paso / 2);
      osc.frequency.linearRampToValueAtTime(650, t0 + (i + 1) * paso);
    }

    // Volumen alto con entrada y salida suaves (sin "clic")
    vol.gain.setValueAtTime(0.0001, t0);
    vol.gain.exponentialRampToValueAtTime(0.9, t0 + 0.05);
    vol.gain.setValueAtTime(0.9, t0 + DURACION - 0.1);
    vol.gain.exponentialRampToValueAtTime(0.0001, t0 + DURACION);

    osc.connect(vol).connect(comp).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + DURACION);
    setTimeout(() => ctx.close(), (DURACION + 0.5) * 1000);
  } catch {
    /* sin audio: solo se muestra el aviso */
  }
};

// Clases comunes (Tailwind v4 + variables del tema del host)
const contenedor = 'fixed inset-x-4 bottom-4 z-[1000] flex justify-end pointer-events-none';
const tarjeta =
  'pointer-events-auto w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 text-[var(--color-text-primary)] shadow-2xl animate-fade-in';
const btnPrimario =
  'inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold tracking-wide text-white transition-colors hover:bg-red-500 cursor-pointer';
const btnSecundario =
  'rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-medium tracking-wide text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-accent-light)] cursor-pointer';

export default function AvisoAlertas({ rutaMapa = '/mapa' }) {
  const navigate = useNavigate();
  const session = getSession();
  const ciudadano = esCiudadano(session);
  const [consentimiento, setConsentimiento] = useState(leerConsentimiento);

  useCompartirUbicacion(ciudadano && consentimiento === 'aceptado');
  const { data: alertas = [] } = useAlertasCercanas({ habilitado: ciudadano });
  const descartar = useDescartarAlerta();

  // Suena solo cuando llega una alerta que no se había visto (no al recargar)
  const vistas = useRef(null);
  useEffect(() => {
    const ids = alertas.map((a) => a.id);
    if (vistas.current === null) {
      vistas.current = new Set(ids);
      return;
    }
    const hayNueva = ids.some((id) => !vistas.current.has(id));
    ids.forEach((id) => vistas.current.add(id));
    if (hayNueva) sonarAlerta();
  }, [alertas]);

  if (!ciudadano) return null;

  const responder = (valor) => {
    guardarConsentimiento(valor);
    setConsentimiento(valor);
  };

  // 1) Consentimiento explícito antes de usar la Geolocation API
  if (!consentimiento) {
    return (
      <div role="dialog" aria-labelledby="up-consent-titulo" data-testid="consentimiento-ubicacion" className={contenedor}>
        <div className={tarjeta}>
          <div className="flex items-center gap-2">
            <MapPin size={18} className="shrink-0 text-[var(--color-accent)]" />
            <strong id="up-consent-titulo" className="text-sm font-bold">¿Quieres recibir alertas cercanas?</strong>
          </div>
          <p className="mt-2 mb-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">
            Usaremos tu ubicación para avisarte de incidentes críticos a menos de 500 m. Solo guardamos la última
            ubicación de las últimas 24 h.
          </p>
          <div className="flex justify-end gap-2">
            <button type="button" className={btnSecundario} onClick={() => responder('rechazado')}>Ahora no</button>
            <button type="button" className={btnPrimario} onClick={() => responder('aceptado')}>Compartir ubicación</button>
          </div>
        </div>
      </div>
    );
  }

  if (!alertas.length) return null;

  // 2) Aviso: la más reciente; las demás quedan en cola
  const alerta = alertas[0];
  const cerrar = () => descartar.mutate(alerta.id);
  const verEnMapa = () => {
    descartar.mutate(alerta.id);
    navigate(`${rutaMapa}?lat=${alerta.lat}&lng=${alerta.lng}&reporte=${alerta.reporteId ?? ''}`);
  };

  return (
    <div role="alert" aria-live="assertive" data-testid="aviso-alerta" className={contenedor}>
      <div className={`${tarjeta} border-l-4 border-l-red-500`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-red-500">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500/30" />
              <AlertTriangle size={16} className="relative" />
            </span>
            <strong className="text-sm font-bold">Alerta cercana: {alerta.tipo}</strong>
          </div>
          <button
            type="button"
            aria-label="Cerrar aviso"
            data-testid="cerrar-alerta"
            onClick={cerrar}
            className="rounded-lg p-1 text-[var(--color-text-secondary)] transition-colors hover:text-red-400 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
        <p className="mt-2 mb-4 text-sm text-[var(--color-text-secondary)]">
          A{' '}
          <span data-testid="distancia-alerta" className="font-semibold text-[var(--color-text-primary)]">
            {formatoDistancia(alerta.distancia)}
          </span>{' '}
          de tu ubicación.
          {alertas.length > 1 && (
            <span className="ml-1 text-xs text-[var(--color-accent)]">(+{alertas.length - 1} más)</span>
          )}
        </p>
        <div className="flex justify-end">
          <button type="button" data-testid="ver-mapa-alerta" className={btnPrimario} onClick={verEnMapa}>
            <MapPin size={14} />
            Ver en el mapa
          </button>
        </div>
      </div>
    </div>
  );
}
