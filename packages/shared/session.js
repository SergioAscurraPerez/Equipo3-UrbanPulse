// Manejo centralizado de la sesión para todos los microfrontends

const SESSION_STORAGE_KEY = 'urbanpulse_citizen_session';
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
    // Entorno sin window
  }
}

export function saveSession(session) {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // localStorage no disponible
  }
  avisarCambio();
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // localStorage no disponible
  }
  avisarCambio();
}

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

// NUEVA FUNCIÓN AÑADIDA para el httpClient.js
export function getToken() {
  const session = getSession();
  // Asumimos que tu backend devuelve el token dentro de una propiedad 'token' o 'jwt'
  // Ajusta 'session.token' si tu n8n lo devuelve con otro nombre (ej. session.accessToken)
  return session ? session.token : null; 
}