// HU-10 / T04: aviso de alertas cercanas en el host (contrato C3, docs/ALERTAS_CONTRACT.md §2)
import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchN8n } from '@urbanpulse/shared';

const INTERVALO_ALERTAS_MS = 30 * 1000;      // consulta de /alertas
const INTERVALO_UBICACION_MS = 5 * 60 * 1000; // C3: máximo una ubicación cada 5 min
const CLAVE_CONSENTIMIENTO = 'up_consentimiento_ubicacion';

const normalizar = (a) => ({
  id: a.id,
  reporteId: a.reporte_id,
  tipo: String(a.tipo || 'Incidente').replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase()),
  severidad: a.severidad,
  distancia: Math.round(Number(a.distancia_m ?? 0)),
  lat: Number(a.lat),
  lng: Number(a.lng),
  fecha: a.creada_en,
});

// ==========================================
// GET /urbanpulse/alertas: pendientes del ciudadano del token (más reciente primero)
// ==========================================
export const useAlertasCercanas = ({ habilitado = true } = {}) =>
  useQuery({
    queryKey: ['alertas-cercanas'],
    enabled: habilitado,
    refetchInterval: INTERVALO_ALERTAS_MS,
    refetchIntervalInBackground: false,
    queryFn: async () => {
      const raw = await fetchN8n('/urbanpulse/alertas');
      return (Array.isArray(raw) ? raw : []).map(normalizar);
    },
  });

// ==========================================
// POST /urbanpulse/alertas/descartar { id }: idempotente
// ==========================================
export const useDescartarAlerta = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (alertaId) => {
      try {
        return await fetchN8n('/urbanpulse/alertas/descartar', {
          method: 'POST',
          body: JSON.stringify({ id: alertaId }),
        });
      } catch (err) {
        // C3: 404 alerta_no_encontrada → ya no está pendiente para este ciudadano; no se restaura
        if (err?.status === 404 || /alerta_no_encontrada/.test(String(err?.message))) return { ok: true };
        throw err;
      }
    },
    onMutate: async (alertaId) => {
      await queryClient.cancelQueries({ queryKey: ['alertas-cercanas'] });
      const previas = queryClient.getQueryData(['alertas-cercanas']);
      queryClient.setQueryData(['alertas-cercanas'], (old) => old?.filter((a) => a.id !== alertaId));
      return { previas };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.previas) queryClient.setQueryData(['alertas-cercanas'], ctx.previas);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['alertas-cercanas'] }),
  });
};

// ==========================================
// Consentimiento y POST /urbanpulse/ubicacion { lat, lng } → 204
// ==========================================
export const leerConsentimiento = () => {
  try { return localStorage.getItem(CLAVE_CONSENTIMIENTO); } catch { return null; }
};
export const guardarConsentimiento = (valor) => {
  try { localStorage.setItem(CLAVE_CONSENTIMIENTO, valor); } catch { /* sin storage */ }
};

const enviarUbicacion = async ({ latitude, longitude }) => {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return; // evita 400 datos_invalidos
  try {
    await fetchN8n('/urbanpulse/ubicacion', {
      method: 'POST',
      body: JSON.stringify({ lat: latitude, lng: longitude }),
    });
  } catch {
    // 204 sin cuerpo puede hacer fallar el parseo JSON del cliente; la app sigue igual sin ubicación
  }
};

export const useCompartirUbicacion = (activo) => {
  useEffect(() => {
    if (!activo || !('geolocation' in navigator)) return undefined;
    let ultimoEnvio = 0;
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const ahora = Date.now();
        if (ahora - ultimoEnvio < INTERVALO_UBICACION_MS) return;
        ultimoEnvio = ahora;
        enviarUbicacion(pos.coords);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) guardarConsentimiento('denegado');
      },
      { enableHighAccuracy: false, maximumAge: 60 * 1000, timeout: 15 * 1000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [activo]);
};