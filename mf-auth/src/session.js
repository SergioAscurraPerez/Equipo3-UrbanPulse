// Sesión compartida por el host y los micro-frontends. Todos viven en la misma
// página y el mismo origen, así que basta con acordar una única clave de
// localStorage: si el host usara una clave propia, el historial nunca vería la
// sesión que abre el usuario desde el chat y acabaría pidiendo los reportes de
// todo el mundo.
const SESSION_STORAGE_KEY = 'urbanpulse_citizen_session';

// localStorage solo dispara 'storage' en las *otras* pestañas, así que además
// avisamos con un evento propio para refrescar las vistas de esta pestaña.
const SESSION_EVENT = 'urbanpulse:sesion';

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (!session.expires_at || new Date(session.expires_at).getTime() <= Date.now()) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

function avisarCambio() {
  try {
    window.dispatchEvent(new window.CustomEvent(SESSION_EVENT));
  } catch {
    // Entorno sin window (SSR, tests)
  }
}

export function saveSession(session) {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // localStorage no disponible (modo privado, etc.)
  }
  avisarCambio();
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // localStorage no disponible (modo privado, etc.)
  }
  avisarCambio();
}

// Devuelve la función para cancelar la suscripción, lista para usarse tal cual
// como retorno de un useEffect.
export function subscribeSession(alCambiar) {
  const manejar = (evento) => {
    if (evento.type === 'storage' && evento.key && evento.key !== SESSION_STORAGE_KEY) return;
    alCambiar(getSession());
  };

  window.addEventListener(SESSION_EVENT, manejar);
  window.addEventListener('storage', manejar);

  return () => {
    window.removeEventListener(SESSION_EVENT, manejar);
    window.removeEventListener('storage', manejar);
  };
}
