import { registerRemotes, loadRemote } from '@module-federation/runtime';

export async function inicializarRemotes() {
  // Vite nos dice si estamos en 'development' (local) o 'production'
  const modoVite = import.meta.env.MODE;
  
  let entorno = 'local';
  if (modoVite === 'production') {
    // Si tienes una variable para staging, la usamos; si no, asumimos producción
    entorno = import.meta.env.VITE_IS_STAGING === 'true' ? 'staging' : 'production';
  }

  try {
    const respuesta = await fetch(`/remotes.${entorno}.json`);
    if (!respuesta.ok) throw new Error(`Error HTTP: ${respuesta.status}`);
    
    const remotesConfig = await respuesta.json();

    // ✨ NUEVO: Transformamos el JSON agregando type: 'module' para que Vite lo entienda
    const modulosFederados = Object.entries(remotesConfig).map(([nombre, url]) => ({
      name: nombre,
      entry: url,
      type: 'module' // <-- ESTA ES LA LÍNEA MÁGICA QUE ARREGLA EL ERROR
    }));

    registerRemotes(modulosFederados);
    console.log(`[Module Federation] Remotos registrados exitosamente para el entorno: ${entorno}`);
  } catch (error) {
    console.error('[Module Federation] Fallo crítico al cargar el manifiesto de remotes:', error);
  }
}

// Esta función reemplazará a los import() estáticos en tu App.jsx
export function cargarRemote(nombreRemote, componente) {
  // Limpiamos el './' inicial si existe, para evitar el error de ruta '././'
  const compLimpio = componente.startsWith('./') ? componente.slice(2) : componente;
  return loadRemote(`${nombreRemote}/${compLimpio}`);
}