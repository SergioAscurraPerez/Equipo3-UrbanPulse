import { clearSession } from './session';

/**
 * Configura un interceptor global para todas las peticiones Fetch de la aplicación.
 * Captura errores 401 (No Autorizado) y 403 (Prohibido) para cerrar la sesión automáticamente.
 */
export const setupFetchInterceptor = () => {
  // Guardamos la función fetch original del navegador
  const originalFetch = window.fetch;

  // Sobrescribimos el fetch global con nuestro "escudo"
  window.fetch = async (...args) => {
    // Ejecutamos la petición original directamente
    const response = await originalFetch(...args);

    // Si el servidor responde con 401 o 403...
    if (response.status === 401 || response.status === 403) {
      const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || response.url || '');

      // Excepción: endpoints públicos u Open Data que no deben desloguear al usuario
      if (!url.includes('mapa-siniestros-sutran')) {
        console.warn(
          `[Seguridad] Error ${response.status} detectado en ${url}. Token inválido o expirado. Cerrando sesión automáticamente...`
        );

        // Invalidamos el estado global
        clearSession();
      }
    }

    return response;
  };
};