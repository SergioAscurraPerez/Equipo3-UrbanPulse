import { test, expect } from '@playwright/test';

// Pruebas de UI del mapa urbano (guía QA, Fase 4, prueba #7) para
// mf-mapa-urbano (MapaUrbano.jsx), montado como microfrontend federado en
// la pestaña "MAPA".
//
// El componente inicializa un mapa real de TomTom (requiere
// VITE_TOMTOM_API_KEY) y, por separado, pega contra el n8n de producción
// (fallback hardcodeado si no existe TE_N8N_REPORTS_LIST_URL) para traer
// el listado histórico de reportes y pintarlos como marcadores coloreados
// por tipo de incidente. Antes de este spec, la app se congelaba
// completamente si faltaba la API key de TomTom (ver commits previos) —
// por eso aquí también se vigila que no aparezcan errores de página al
// entrar a esta pestaña.

const REPORTS_LIST_PATH = '**/webhook/urbanpulse/reports-list';

const INCIDENT_TYPE_LABELS = [
  'Infraestructura vial',
  'Alumbrado público',
  'Agua y saneamiento',
  'Residuos',
  'Arbolado urbano',
  'Incendio',
  'Otro',
];

const SAMPLE_REPORTS = [
  { latitude: -12.05, longitude: -77.03, incident_type: 'infraestructura_vial' },
  { latitude: -12.06, longitude: -77.04, incident_type: 'incendio' },
];

test.beforeEach(async ({ page }) => {
  await page.route(
    (url) =>
      url.hostname !== 'localhost' &&
      url.hostname !== '127.0.0.1' &&
      !url.hostname.endsWith('tomtom.com'),
    (route) => route.abort()
  );
  // Los tiles/estilos reales de TomTom tampoco son alcanzables desde este
  // entorno de pruebas; se abortan aparte para no dejarlos "colgados"
  // esperando una respuesta que nunca llega.
  await page.route('**/*.tomtom.com/**', (route) => route.abort());

  await page.addInitScript(() => {
    window.localStorage.setItem(
      'urbanpulse_session',
      JSON.stringify({
        success: true,
        username: 'qa-tester',
        role: 'Operador QA',
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      })
    );
  });

  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
});

test('la pestaña Mapa carga sin errores de página (regresión: antes se congelaba sin API key)', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.route(REPORTS_LIST_PATH, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(SAMPLE_REPORTS) })
  );

  await page.getByRole('button', { name: 'MAPA', exact: true }).click();
  await page.waitForTimeout(500);

  expect(pageErrors).toEqual([]);
});

test('muestra la leyenda con los 7 tipos de incidente', async ({ page }) => {
  await page.route(REPORTS_LIST_PATH, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(SAMPLE_REPORTS) })
  );

  await page.getByRole('button', { name: 'MAPA', exact: true }).click();

  await expect(page.getByText('Tipo de incidente')).toBeVisible();
  for (const label of INCIDENT_TYPE_LABELS) {
    await expect(page.getByText(label, { exact: true })).toBeVisible();
  }
});

test('pide el listado de reportes históricos al backend al entrar a Mapa', async ({ page }) => {
  let requested = false;
  await page.route(REPORTS_LIST_PATH, (route) => {
    requested = true;
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(SAMPLE_REPORTS) });
  });

  await page.getByRole('button', { name: 'MAPA', exact: true }).click();

  await expect.poll(() => requested).toBe(true);
});

test('si el listado de reportes falla, el mapa y la leyenda se mantienen visibles', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.route(REPORTS_LIST_PATH, (route) => route.abort('failed'));

  await page.getByRole('button', { name: 'MAPA', exact: true }).click();
  await page.waitForTimeout(500);

  await expect(page.getByText('Tipo de incidente')).toBeVisible();
  expect(pageErrors).toEqual([]);
});
