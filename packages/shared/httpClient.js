import { getToken, clearSession } from './session.js';

const BASE_URL = 'https://urbanpulse-n8n.xq33kajky1yy6.us-east-1.cs.amazonlightsail.com/webhook';

export async function fetchN8n(endpoint, options = {}) {
  const token = getToken();
  const method = (options.method || 'GET').toUpperCase();
  const headers = {
    ...options.headers,
  };

  // Solo enviar Content-Type cuando existe un cuerpo
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const url = `${BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      method,
      headers,
    });

    if (response.status === 401 || response.status === 403) {
      console.warn('[Shared HTTP] Sesión expirada o no autorizada.');
      clearSession();
      throw new Error('Sesión expirada');
    }

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`[Shared HTTP] Fallo al consultar ${endpoint}:`, error);
    throw error;
  }
}