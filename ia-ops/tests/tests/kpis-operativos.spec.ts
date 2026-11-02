import { test, expect, type Page, type Route } from '@playwright/test';

// HU-11 T05 — Pruebas de los KPIs de operativos.
//
//   1. La pestaña «Operativos» del dashboard se actualiza sola cuando se cierra
//      un operativo: el gráfico de efectividad suma una barra sin recargar la
//      página (HU-11 T03, useAutoRefresh cada 30 s).
//   2. La tarjeta del modelo del panel de riesgo muestra la etiqueta F1-macro
//      con el valor que entrega el contrato C5 (HU-11 T04).
//
// El backend de n8n se simula con page.route(), con el mismo criterio que
// operativos.spec.ts. El operativo se cierra con una llamada real a
// POST /operativos/asignar (contrato C2) hecha desde el navegador, así pasa por
// el mismo simulador que lee GET /kpis-operativos (contrato C4): el cierre es lo
// único que mueve el gráfico, no un cambio de datos hecho a mano en la prueba.

const KPIS_OPERATIVOS = '/webhook/urbanpulse/kpis-operativos';
const CIERRE_OPERATIVO = '/webhook/urbanpulse/operativos/asignar';

// Útil para comprobar el valor y la etiqueta con tres decimales, como MLflow.
const F1_MACRO = 0.7384;

const OPERATIVO_CERRADO = {
  id: '1d6f3b0a-5e7c-4a92-8b14-2c9e7a0f6d31',
  zona: 'Miraflores',
  tipo_principal: 'bache',
  incluidos: 5,
  resueltos: 4,
  efectividad: 0.8,
  horas_atencion: 26.5,
};

const OPERATIVO_POR_CERRAR = {
  id: '9c1e4b7a-3d52-4f08-8a6e-5b2d7c1f0a43',
  zona: 'San Isidro',
  tipo_principal: 'semaforo_danado',
  incluidos: 3,
  resueltos: 3,
  efectividad: 1,
  horas_atencion: 12.0,
};

const SESION_OPERADOR = {
  id: 'operador-hu11',
  username: 'operador-hu11',
  role: 'operador',
};

function inyectarSesion(page: Page) {
  return page.addInitScript((datos) => {
    window.localStorage.setItem(
      'urbanpulse_citizen_session',
      JSON.stringify({ ...datos, expires_at: new Date(Date.now() + 3600_000).toISOString() })
    );
  }, SESION_OPERADOR);
}

// Sin salida a redes externas (tiles de TomTom, Gemini) esas peticiones se
// quedan colgando y congelan la página. Mismo criterio que operativos.spec.ts.
async function bloquearRedExterna(page: Page) {
  await page.route(
    (url) => url.hostname !== 'localhost' && url.hostname !== '127.0.0.1',
    (route) => route.abort()
  );
}

const responder = (route: Route, status: number, cuerpo: unknown) =>
  route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(cuerpo),
    // El host (3000) y n8n son orígenes distintos: sin esto el navegador
    // descarta la respuesta simulada por CORS.
    headers: { 'access-control-allow-origin': '*' },
  });

const preflight = (route: Route) =>
  route.fulfill({
    status: 204,
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-headers': '*',
      'access-control-allow-methods': 'GET,POST,OPTIONS',
    },
  });

// Backend en memoria: los operativos cerrados que ve el dashboard. Cerrar uno
// lo agrega a la lista, igual que el workflow real (ADR-016).
async function simularBackendKpis(page: Page) {
  const cerrados = [OPERATIVO_CERRADO];
  const sinCerrar = [OPERATIVO_POR_CERRAR];
  const consultas = { kpis: 0 };

  await page.route(
    (url) => url.pathname === KPIS_OPERATIVOS || url.pathname === CIERRE_OPERATIVO,
    async (route) => {
      const peticion = route.request();
      if (peticion.method() === 'OPTIONS') return preflight(route);

      const { pathname } = new URL(peticion.url());

      if (pathname === KPIS_OPERATIVOS && peticion.method() === 'GET') {
        consultas.kpis += 1;
        return responder(route, 200, {
          // El más reciente primero, como lo entrega el contrato C4.
          operativos: [...cerrados].reverse(),
          tiempo_por_tipo: [
            { tipo: 'bache', semana: '2026-W44', horas_promedio: 31.2 },
            { tipo: 'semaforo_danado', semana: '2026-W44', horas_promedio: 12 },
          ],
          actualizado: new Date().toISOString(),
        });
      }

      if (pathname === CIERRE_OPERATIVO && peticion.method() === 'POST') {
        const cuerpo = peticion.postDataJSON();
        const indice = sinCerrar.findIndex((o) => o.id === cuerpo.operativo_id);
        if (indice === -1 || cuerpo.estado !== 'cerrado') {
          return responder(route, 404, { error: 'operativo_no_encontrado' });
        }
        const [operativo] = sinCerrar.splice(indice, 1);
        cerrados.push(operativo);
        return responder(route, 200, { ...operativo, estado: 'cerrado' });
      }

      return route.fallback();
    }
  );

  return { cerrados, consultas };
}

// ---------------------------------------------------------------------------
// El dashboard se actualiza solo tras cerrar un operativo
// ---------------------------------------------------------------------------

test.describe('HU-11 · KPIs de operativos', () => {
  test('el gráfico suma el operativo cerrado sin recargar la página', async ({ page }) => {
    // El refresco automático corre cada 30 s (INTERVALO_OPERATIVOS_MS de
    // mf-dashboard): hay que esperarlo de verdad, con margen para el CI.
    test.setTimeout(120_000);

    await bloquearRedExterna(page);
    await inyectarSesion(page);
    const backend = await simularBackendKpis(page);

    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await page.getByRole('link', { name: 'DASHBOARD', exact: true }).click();
    await page.getByTestId('pestana-operativos').click();

    // --- Estado inicial: un operativo cerrado -------------------------------
    const barras = page.locator('.recharts-bar-rectangle');
    await expect(page.getByText('Efectividad por operativo')).toBeVisible();
    await expect(barras).toHaveCount(1);

    // Marca en la página: si algo la recargara, la marca desaparecería.
    await page.evaluate(() => {
      (window as unknown as { __sinRecarga: boolean }).__sinRecarga = true;
    });
    const consultasAntes = backend.consultas.kpis;

    // --- Cerrar un operativo por API ----------------------------------------
    const cierre = await page.evaluate(
      async ({ url, operativoId }) => {
        const respuesta = await fetch(url, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ operativo_id: operativoId, estado: 'cerrado' }),
        });
        return { status: respuesta.status, cuerpo: await respuesta.json() };
      },
      { url: `http://localhost:5678${CIERRE_OPERATIVO}`, operativoId: OPERATIVO_POR_CERRAR.id }
    );
    expect(cierre.status).toBe(200);
    expect(cierre.cuerpo.estado).toBe('cerrado');
    expect(backend.cerrados).toHaveLength(2);

    // --- El gráfico cambia solo, sin recargar -------------------------------
    // El intervalo es de 30 s: se espera un poco más que eso.
    await expect(barras).toHaveCount(2, { timeout: 45_000 });

    // El refresco fue una petición nueva de la propia vista, no una recarga.
    expect(backend.consultas.kpis).toBeGreaterThan(consultasAntes);
    expect(
      await page.evaluate(() => (window as unknown as { __sinRecarga?: boolean }).__sinRecarga),
      'la página se recargó: el gráfico debía actualizarse solo'
    ).toBe(true);

    // La línea de tiempo por tipo sigue en pantalla con ambos tipos.
    await expect(page.getByText('Tiempo medio de atención por tipo (horas)')).toBeVisible();
    await expect(page.getByText('Última actualización:')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// La tarjeta del modelo muestra el F1-macro
// ---------------------------------------------------------------------------

test.describe('HU-11 · tarjeta del modelo', () => {
  test('el panel de riesgo muestra la etiqueta F1-macro con su valor', async ({ page }) => {
    await bloquearRedExterna(page);
    await inyectarSesion(page);

    let consultas = 0;
    await page.route(
      (url) => url.pathname === '/webhook/urbanpulse/riesgo-predictivo',
      (route) => {
        if (route.request().method() === 'OPTIONS') return preflight(route);
        consultas += 1;
        // Contrato C5: modelo.f1_macro viene del registro del modelo en MLflow.
        return responder(route, 200, {
          generado: '2026-10-29T08:00:00-05:00',
          modelo: {
            version: 'riesgo_vial@4',
            f1_macro: F1_MACRO,
            entrenado: '2026-10-03',
            sesgo_ok: true,
            monitoreo: { fecha: '2026-10-05', deriva: false },
          },
          zonas: [
            {
              zona_id: 'MIR-014',
              nombre: 'Av. Larco - Benavides',
              distrito: 'Miraflores',
              lat: -12.1263,
              lng: -77.0297,
              nivel: 'medio',
              probabilidad: 0.42,
              motivos: ['12 siniestros en el último año'],
            },
          ],
        });
      }
    );

    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await page.getByRole('link', { name: 'RIESGO PREDICTIVO', exact: true }).click();

    const tarjeta = page.locator('section').filter({ hasText: 'Modelo en producción' });
    await expect(tarjeta).toBeVisible();

    // La etiqueta es la métrica del pipeline (ml/README.md), no «Precisión» ni
    // «Accuracy»: el F1-macro es el que reporta MLflow.
    await expect(tarjeta.getByText(/F1-macro/)).toBeVisible();

    // Con tres decimales, igual que MLflow: 0.7384 se muestra como 0.738.
    await expect(tarjeta.getByTestId('f1-macro')).toHaveText('0.738');
    await expect(tarjeta).toContainText('riesgo_vial@4');

    expect(consultas, 'el panel no pidió la predicción al webhook').toBeGreaterThan(0);
  });

  test('si MLflow no entrega el F1-macro la tarjeta dice «Pendiente»', async ({ page }) => {
    await bloquearRedExterna(page);
    await inyectarSesion(page);

    await page.route(
      (url) => url.pathname === '/webhook/urbanpulse/riesgo-predictivo',
      (route) => {
        if (route.request().method() === 'OPTIONS') return preflight(route);
        return responder(route, 200, {
          generado: '2026-10-29T08:00:00-05:00',
          modelo: {
            version: 'riesgo_vial@4',
            f1_macro: null,
            entrenado: '2026-10-03',
            sesgo_ok: true,
            monitoreo: null,
          },
          zonas: [],
        });
      }
    );

    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await page.getByRole('link', { name: 'RIESGO PREDICTIVO', exact: true }).click();

    const f1 = page.getByTestId('f1-macro');
    await expect(f1).toBeVisible();
    // Nunca otro valor en lugar del F1-macro que falta.
    await expect(f1).toHaveText('Pendiente');
    await expect(f1).not.toContainText(/\d\.\d/);
  });
});
