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
    try {
      // Ejecutamos la petición original de forma normal
      const response = await originalFetch(...args);

      // Si el servidor de n8n o backend responde con 401 o 403...
      if (response.status === 401 || response.status === 403) {
        console.warn(`[Seguridad] Error ${response.status} detectado. Token inválido o expirado. Cerrando sesión automáticamente...`);
        
        // Invalidamos el estado global (cumpliendo con el T02 de tu HU-03)
        clearSession();
        
        // Opcional: Podrías forzar una recarga aquí si tus microfrontends se quedan pegados
        // window.location.href = '/'; 
      }

      return response;
    } catch (error) {
      // Si la red se cae por completo, dejamos que el error fluya
      throw error;
    }
  };
};