import { test, expect, type Page, type Route } from '@playwright/test';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

// HU-10 T06 — Aviso de alertas cercanas en la app (contrato C3,
// docs/ALERTAS_CONTRACT.md; ADR-017).
//
//   1. Si hay una alerta pendiente, el host muestra el aviso.
//   2. El ciudadano lo cierra: la app llama a POST /alertas/descartar con el id
//      de la alerta y el aviso desaparece.
//   3. No vuelve: ni al recargar la página ni en la consulta siguiente, porque
//      el backend ya no la devuelve (descartada_en deja de ser NULL).
//   4. Sin alertas no hay aviso. Con el permiso de ubicación la app envía la
//      ubicación; sin él no envía nada (contrato, sección 4).
//
// El backend se simula con page.route() y un estado en memoria, con el mismo
// criterio que operativos.spec.ts. La distancia de 499 m / 501 m y los 404 de
// alertas ajenas los comprueba la colección Newman
// postman/collections/urbanpulse-alertas-cercanas.postman_collection.json
// contra el backend real.
//
// El componente AvisoAlerta lo entrega HU-10 T04 (Kiara). Hasta que esté en el
// host, esta suite se omite en vez de fallar. Cuando se mezcle, solo hay que
// confirmar los dos localizadores de AVISO y CERRAR.

const RAIZ_HOST = resolve(__dirname, '..', '..', '..', 'src', 'frontend', 'src');

function hostTieneAvisoAlerta(dir = RAIZ_HOST): boolean {
  if (!existsSync(dir)) return false;
  return readdirSync(dir).some((nombre) => {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) return hostTieneAvisoAlerta(ruta);
    return /\.(jsx?|tsx?)$/.test(nombre) && readFileSync(ruta, 'utf8').includes('AvisoAlerta');
  });
}

const AVISO_LISTO = hostTieneAvisoAlerta();

const ALERTA = {
  id: '5d1e7b0a-2c3f-4f6e-9a8b-1c2d3e4f5a6b',
  reporte_id: 'a3f1c2e4-9b7d-4e2a-9c51-0d8f2b7a1e44',
  tipo: 'infraestructura_vial',
  severidad: 'alta',
  distancia_m: 320,
  lat: -12.1203,
  lng: -77.0311,
  creada_en: '2026-10-24T15:02:11Z',
};

const SESION_CIUDADANO = {
  success: true,
  id: '33333333-3333-4333-8333-333333333333',
  email: 'ciudadano-hu10@ejemplo.com',
  role: 'ciudadano',
  token: 'token-de-prueba',
};

const UBICACION = { latitude: -12.1211, longitude: -77.0297 };

// Localizadores del aviso. Ajustar aquí si HU-10 T04 usa otro marcado.
const aviso = (page: Page) => page.getByRole('alert').filter({ hasText: /320\s*m/ });
const cerrar = (page: Page) =>
  aviso(page).getByRole('button', { name: /cerrar|descartar|entendido/i });

function inyectarSesion(page: Page, sesion: Record<string, unknown>) {
  return page.addInitScript((datos) => {
    window.localStorage.setItem(
      'urbanpulse_citizen_session',
      JSON.stringify({ ...datos, expires_at: new Date(Date.now() + 3600_000).toISOString() })
    );
  }, sesion);
}

async function bloquearRedExterna(page: Page) {
  await page.route(
    (url) => url.hostname !== 'localhost' && url.hostname !== '127.0.0.1',
    (route) => route.abort()
  );
}

const responder = (route: Route, status: number, cuerpo?: unknown) =>
  route.fulfill({
    status,
    contentType: 'application/json',
    body: cuerpo === undefined ? '' : JSON.stringify(cuerpo),
    headers: { 'access-control-allow-origin': '*' },
  });

// Backend de alertas en memoria: los tres webhooks del contrato C3.
async function simularBackendAlertas(page: Page, pendientes = [ALERTA]) {
  const estado = {
    pendientes: [...pendientes],
    descartes: [] as string[],
    ubicaciones: [] as { lat: number; lng: number }[],
    consultas: 0,
  };

  await page.route('**/webhook/urbanpulse/reports-list*', (route) => responder(route, 200, []));

  await page.route(
    (url) => /^\/webhook\/urbanpulse\/(alertas|ubicacion)/.test(url.pathname),
    async (route) => {
      const peticion = route.request();
      const { pathname } = new URL(peticion.url());
      const ruta = pathname.replace('/webhook/urbanpulse', '');

      if (peticion.method() === 'OPTIONS') {
        return route.fulfill({
          status: 204,
          headers: {
            'access-control-allow-origin': '*',
            'access-control-allow-headers': '*',
            'access-control-allow-methods': 'GET,POST,OPTIONS',
          },
        });
      }

      if (ruta === '/alertas' && peticion.method() === 'GET') {
        estado.consultas += 1;
        return responder(route, 200, estado.pendientes);
      }

      if (ruta === '/alertas/descartar' && peticion.method() === 'POST') {
        const { id } = peticion.postDataJSON();
        estado.descartes.push(id);
        estado.pendientes = estado.pendientes.filter((a) => a.id !== id);
        return responder(route, 200, { ok: true });
      }

      if (ruta === '/ubicacion' && peticion.method() === 'POST') {
        estado.ubicaciones.push(peticion.postDataJSON());
        return route.fulfill({
          status: 204,
          headers: { 'access-control-allow-origin': '*' },
        });
      }

      return route.fallback();
    }
  );

  return estado;
}

test.describe('HU-10 · aviso de alertas cercanas', () => {
  test.skip(!AVISO_LISTO, 'Falta el componente AvisoAlerta del host (HU-10 T04).');
  test.use({ permissions: ['geolocation'], geolocation: UBICACION });

  test.beforeEach(async ({ page }) => {
    await bloquearRedExterna(page);
    await inyectarSesion(page, SESION_CIUDADANO);
  });

  test('el aviso aparece con la alerta pendiente', async ({ page }) => {
    await simularBackendAlertas(page);

    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

    await expect(aviso(page)).toBeVisible();
  });

  test('el aviso se cierra, se descarta en el backend y no vuelve al recargar', async ({
    page,
  }) => {
    const backend = await simularBackendAlertas(page);

    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await expect(aviso(page)).toBeVisible();

    await cerrar(page).click();

    await expect(aviso(page)).toHaveCount(0);
    // Sin esta comprobación la prueba pasaría si el botón solo ocultara el
    // aviso en pantalla: al recargar, la alerta seguiría pendiente.
    await expect.poll(() => backend.descartes).toEqual([ALERTA.id]);

    const consultasAntes = backend.consultas;
    await page.reload({ waitUntil: 'domcontentloaded' });
    // Tras recargar, el host vuelve a consultar y el backend ya no la devuelve.
    await expect.poll(() => backend.consultas).toBeGreaterThan(consultasAntes);
    await expect(aviso(page)).toHaveCount(0);
  });

  test('la consulta siguiente no la trae de vuelta mientras la sesión sigue abierta', async ({
    page,
  }) => {
    const backend = await simularBackendAlertas(page);

    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await cerrar(page).click();
    await expect.poll(() => backend.descartes).toHaveLength(1);

    // Sale a otra sección y vuelve: el host vuelve a consultar /alertas.
    await page.getByRole('button', { name: 'MAPA', exact: true }).click();
    await page.getByRole('button', { name: 'CHAT', exact: true }).click();

    await expect(aviso(page)).toHaveCount(0);
    expect(backend.descartes).toHaveLength(1);
  });

  test('sin alertas pendientes no se muestra ningún aviso', async ({ page }) => {
    const backend = await simularBackendAlertas(page, []);

    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await expect.poll(() => backend.consultas).toBeGreaterThan(0);

    await expect(page.getByRole('alert').filter({ hasText: /\d+\s*m\b/ })).toHaveCount(0);
  });

  test('con el permiso de ubicación la app envía la ubicación al backend', async ({ page }) => {
    const backend = await simularBackendAlertas(page, []);

    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

    await expect.poll(() => backend.ubicaciones.length).toBeGreaterThan(0);
    expect(backend.ubicaciones[0].lat).toBeCloseTo(UBICACION.latitude, 4);
    expect(backend.ubicaciones[0].lng).toBeCloseTo(UBICACION.longitude, 4);
  });
});

test.describe('HU-10 · sin permiso de ubicación', () => {
  test.skip(!AVISO_LISTO, 'Falta el componente AvisoAlerta del host (HU-10 T04).');
  test.use({ permissions: [] });

  test('no se envía ninguna ubicación y la app sigue funcionando', async ({ page }) => {
    await bloquearRedExterna(page);
    await inyectarSesion(page, SESION_CIUDADANO);
    const backend = await simularBackendAlertas(page, []);

    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: 'CHAT', exact: true })).toBeVisible();

    // Margen para que un envío indebido tuviera tiempo de ocurrir.
    await page.waitForTimeout(1500);
    expect(backend.ubicaciones).toHaveLength(0);
  });
});
