import { test, expect, type Page, type Route } from '@playwright/test';

// HU-09 T05 — Pruebas del flujo de operativos.
//
//   1. El operador agrupa los incidentes por zona, crea un operativo, le asigna
//      una cuadrilla y lo cierra (contrato C2, docs/OPERATIVOS_CONTRACT.md).
//   2. Un ciudadano que abre /incidentes es redirigido: el guard de rutas
//      (RutaProtegida) solo deja pasar al operador.
//   3. Si el backend responde 403 rol_no_permitido, el tablero lo muestra en
//      vez de dar el cambio por hecho.
//
// El backend de n8n se simula con page.route(), con el mismo criterio que
// alertas-tiempo-real.spec.ts: la prueba no depende de cuentas ni de datos
// reales y no golpea producción desde CI. El simulador guarda estado (un
// operativo creado aparece en la lista, uno cerrado sale de la columna
// anterior) porque lo que se comprueba es el flujo completo, no cada llamada
// por separado. Los 403 reales de los webhooks los cubre la suite Newman
// postman/collections/urbanpulse-operativos.postman_collection.json.

const OPERATIVO_ID = '9c1e4b7a-3d52-4f08-8a6e-5b2d7c1f0a43';

const ZONA = { zona: 'Miraflores', zona_id: 'MIRAFLORES' };

const INCIDENTES = [
  {
    id: 'a3f1c2e4-9b7d-4e2a-9c51-0d8f2b7a1e44',
    tipo: 'bache',
    severidad: 'alta',
    creado: '2026-10-20T10:00:00Z',
  },
  {
    id: 'b7d2e5f1-4c63-4a19-8e07-6f3a9d1c2b58',
    tipo: 'semaforo_danado',
    severidad: 'media',
    creado: '2026-10-20T11:15:00Z',
  },
];

const CUADRILLAS = [
  { id: 1, nombre: 'Bacheo 1', especialidad: 'bacheo' },
  { id: 2, nombre: 'Señalización 1', especialidad: 'senalizacion' },
  { id: 3, nombre: 'Semáforos 1', especialidad: 'semaforos' },
  { id: 4, nombre: 'Limpieza 1', especialidad: 'limpieza' },
];

const SESION_OPERADOR = {
  id: 'operador-hu09',
  username: 'operador-hu09',
  role: 'operador',
};

const SESION_CIUDADANO = {
  success: true,
  id: '33333333-3333-4333-8333-333333333333',
  email: 'ciudadano-hu09@ejemplo.com',
  role: 'ciudadano',
};

function inyectarSesion(page: Page, sesion: Record<string, unknown>) {
  return page.addInitScript((datos) => {
    window.localStorage.setItem(
      'urbanpulse_citizen_session',
      JSON.stringify({ ...datos, expires_at: new Date(Date.now() + 3600_000).toISOString() })
    );
  }, sesion);
}

// Sin salida a redes externas (tiles de TomTom, Gemini) esas peticiones se
// quedan colgando y congelan la página. Mismo criterio que alertas-tiempo-real.
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

type Operativo = {
  id: string;
  zona: string;
  zona_id: string;
  estado: 'planificado' | 'asignado' | 'en_curso' | 'cerrado';
  cuadrilla: { id: number; nombre: string } | null;
  reportes: number;
  creado_en: string;
  asignado_en: string | null;
  cerrado_en: string | null;
};

// Backend de operativos en memoria: los cinco webhooks del contrato C2.
async function simularBackendOperativos(page: Page) {
  const operativos: Operativo[] = [];
  const llamadas: { ruta: string; cuerpo: any }[] = [];

  const incidentesLibres = () => (operativos.length ? [] : INCIDENTES);

  await page.route('**/webhook/urbanpulse/reports-list*', (route) => responder(route, 200, []));

  await page.route(
    (url) => url.pathname.startsWith('/webhook/urbanpulse/') && /\/(incidentes-por-zona|operativos|cuadrillas)/.test(url.pathname),
    async (route) => {
      const peticion = route.request();

      // La petición previa (preflight) no lleva cuerpo ni se contabiliza.
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

      const { pathname } = new URL(peticion.url());
      const ruta = pathname.replace('/webhook/urbanpulse', '');
      const metodo = peticion.method();

      if (ruta === '/incidentes-por-zona' && metodo === 'GET') {
        const libres = incidentesLibres();
        return responder(
          route,
          200,
          libres.length ? [{ ...ZONA, total: libres.length, incidentes: libres }] : []
        );
      }

      if (ruta === '/cuadrillas' && metodo === 'GET') {
        return responder(route, 200, CUADRILLAS);
      }

      if (ruta === '/operativos' && metodo === 'GET') {
        return responder(route, 200, operativos);
      }

      if (ruta === '/operativos' && metodo === 'POST') {
        const cuerpo = peticion.postDataJSON();
        llamadas.push({ ruta, cuerpo });
        const nuevo: Operativo = {
          id: OPERATIVO_ID,
          zona: ZONA.zona,
          zona_id: ZONA.zona_id,
          estado: 'planificado',
          cuadrilla: null,
          reportes: cuerpo.reportes.length,
          creado_en: new Date().toISOString(),
          asignado_en: null,
          cerrado_en: null,
        };
        operativos.unshift(nuevo);
        return responder(route, 201, { id: nuevo.id, estado: nuevo.estado });
      }

      if (ruta === '/operativos/asignar' && metodo === 'POST') {
        const cuerpo = peticion.postDataJSON();
        llamadas.push({ ruta, cuerpo });
        const operativo = operativos.find((o) => o.id === cuerpo.operativo_id);
        if (!operativo) return responder(route, 404, { error: 'operativo_no_encontrado' });

        if (cuerpo.cuadrilla_id) {
          const cuadrilla = CUADRILLAS.find((c) => c.id === cuerpo.cuadrilla_id);
          operativo.cuadrilla = cuadrilla ? { id: cuadrilla.id, nombre: cuadrilla.nombre } : null;
        }
        operativo.estado = cuerpo.estado;
        if (cuerpo.estado === 'asignado' && !operativo.asignado_en) {
          operativo.asignado_en = new Date().toISOString();
        }
        if (cuerpo.estado === 'cerrado') operativo.cerrado_en = new Date().toISOString();
        return responder(route, 200, operativo);
      }

      return route.fallback();
    }
  );

  return { operativos, llamadas };
}

// ---------------------------------------------------------------------------
// El operador: agrupar, crear, asignar y cerrar
// ---------------------------------------------------------------------------

test.describe('HU-09 · operador', () => {
  test('agrupa por zona, crea un operativo, lo asigna y lo cierra', async ({ page }) => {
    await bloquearRedExterna(page);
    await inyectarSesion(page, SESION_OPERADOR);
    const backend = await simularBackendOperativos(page);

    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await page.getByRole('link', { name: 'GESTIÓN DE INCIDENTES', exact: true }).click();

    // --- Agrupar por zona ----------------------------------------------------
    await page.getByTestId('pestana-zonas').click();

    const zona = page.getByTestId(`zona-${ZONA.zona_id}`);
    await expect(zona).toBeVisible();
    await expect(zona.getByText(`${INCIDENTES.length} incidente(s)`)).toBeVisible();

    // Sin incidentes marcados no se puede crear un operativo.
    const crear = zona.getByRole('button', { name: 'Crear operativo' });
    await expect(crear).toBeDisabled();

    await zona.getByRole('button', { name: new RegExp(ZONA.zona) }).click();
    await zona.getByLabel('Seleccionar todos').check();
    await expect(crear).toBeEnabled();

    // --- Crear el operativo --------------------------------------------------
    await crear.click();
    const dialogoCrear = page.getByRole('dialog', { name: 'Crear operativo' });
    await expect(dialogoCrear.getByText('Planificado')).toBeVisible();
    await page.getByTestId('confirmar-operativo').click();

    await expect(page.getByRole('status')).toContainText('Quedó como planificado');

    // El contrato pide la clave de zona y los ids exactos que se marcaron.
    const creacion = backend.llamadas.find((l) => l.ruta === '/operativos');
    expect(creacion, 'la pantalla no llegó a crear el operativo').toBeDefined();
    expect(creacion!.cuerpo.zona).toBe(ZONA.zona_id);
    expect([...creacion!.cuerpo.reportes].sort()).toEqual(INCIDENTES.map((i) => i.id).sort());

    // Los incidentes ya están en un operativo: salen de la lista por agrupar.
    await expect(page.getByText('No hay incidentes por agrupar')).toBeVisible();

    // --- Asignar una cuadrilla ----------------------------------------------
    await page.getByTestId('pestana-operativos').click();

    const tarjeta = page.getByTestId(`operativo-${OPERATIVO_ID}`);
    await expect(page.getByTestId('columna-planificado')).toContainText(ZONA.zona);
    await expect(tarjeta).toContainText(`${INCIDENTES.length} incidente(s)`);

    await page.getByTestId(`abrir-asignar-${OPERATIVO_ID}`).click();
    // «Asignar» sigue apagado hasta elegir cuadrilla.
    await expect(page.getByTestId(`asignar-${OPERATIVO_ID}`)).toBeDisabled();
    await page.getByTestId(`opcion-cuadrilla-${OPERATIVO_ID}-1`).click();
    await page.getByTestId(`asignar-${OPERATIVO_ID}`).click();

    await expect(page.getByRole('status')).toContainText('asignado a Bacheo 1');
    await expect(page.getByTestId('columna-asignado')).toContainText('Bacheo 1');
    await expect(page.getByTestId('columna-planificado')).not.toContainText(ZONA.zona);

    const asignacion = backend.llamadas.find(
      (l) => l.ruta === '/operativos/asignar' && l.cuerpo.estado === 'asignado'
    );
    expect(asignacion!.cuerpo.operativo_id).toBe(OPERATIVO_ID);
    expect(asignacion!.cuerpo.cuadrilla_id).toBe(1);

    // --- Cerrar --------------------------------------------------------------
    await page.getByTestId(`cerrar-${OPERATIVO_ID}`).click();
    const dialogoCierre = page.getByRole('dialog', { name: 'Cerrar operativo' });
    await expect(dialogoCierre).toContainText('No se puede reabrir');
    await page.getByTestId('confirmar-cierre').click();

    await expect(page.getByRole('status')).toContainText('cerrado');
    await expect(page.getByRole('status')).toContainText(`${INCIDENTES.length} incidente(s) quedaron resueltos`);
    await expect(page.getByTestId('columna-cerrado')).toContainText(ZONA.zona);
    await expect(page.getByTestId('columna-asignado')).not.toContainText(ZONA.zona);

    // Cerrado no tiene acciones: reabrir no está en el contrato.
    await expect(page.getByTestId(`cerrar-${OPERATIVO_ID}`)).toHaveCount(0);
    await expect(page.getByTestId(`abrir-asignar-${OPERATIVO_ID}`)).toHaveCount(0);
  });

  test('si el backend responde 403 el tablero lo avisa y el operativo no cambia', async ({
    page,
  }) => {
    await bloquearRedExterna(page);
    await inyectarSesion(page, SESION_OPERADOR);
    const backend = await simularBackendOperativos(page);

    // El operativo ya existe y está planificado.
    backend.operativos.push({
      id: OPERATIVO_ID,
      zona: ZONA.zona,
      zona_id: ZONA.zona_id,
      estado: 'planificado',
      cuadrilla: null,
      reportes: INCIDENTES.length,
      creado_en: new Date().toISOString(),
      asignado_en: null,
      cerrado_en: null,
    });

    // El token vencido o de otro rol llega al backend aunque la UI no lo sepa:
    // el guard del frontend solo protege la pantalla (RutaProtegida.jsx).
    await page.route('**/webhook/urbanpulse/operativos/asignar', (route) =>
      route.request().method() === 'OPTIONS'
        ? route.fallback()
        : responder(route, 403, { error: 'rol_no_permitido' })
    );

    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await page.getByRole('link', { name: 'GESTIÓN DE INCIDENTES', exact: true }).click();
    await page.getByTestId('pestana-operativos').click();

    await page.getByTestId(`abrir-asignar-${OPERATIVO_ID}`).click();
    await page.getByTestId(`opcion-cuadrilla-${OPERATIVO_ID}-2`).click();
    await page.getByTestId(`asignar-${OPERATIVO_ID}`).click();

    await expect(page.getByRole('status')).toContainText('Solo un operador puede gestionar operativos.');
    await expect(page.getByTestId('columna-planificado')).toContainText(ZONA.zona);
    await expect(page.getByTestId('columna-asignado')).not.toContainText(ZONA.zona);
  });
});

// ---------------------------------------------------------------------------
// El ciudadano no entra a /incidentes
// ---------------------------------------------------------------------------

test.describe('HU-09 · ciudadano', () => {
  test('un ciudadano que abre /incidentes es redirigido al inicio', async ({ page }) => {
    await bloquearRedExterna(page);
    await inyectarSesion(page, SESION_CIUDADANO);

    // Si la redirección fallara, el módulo de gestión empezaría a pedir datos
    // de operativos: se registra para comprobar que NO lo hace.
    const pidioOperativos: string[] = [];
    page.on('request', (req) => {
      if (/\/webhook\/urbanpulse\/(incidentes-por-zona|operativos|cuadrillas)/.test(req.url())) {
        pidioOperativos.push(req.url());
      }
    });

    await page.goto('http://localhost:3000/incidentes', { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveURL('http://localhost:3000/');
    await expect(page.getByTestId('pestana-zonas')).toHaveCount(0);
    await expect(page.getByTestId('tablero-operativos')).toHaveCount(0);

    // Y el menú del ciudadano no ofrece la gestión de incidentes.
    await expect(
      page.getByRole('link', { name: 'GESTIÓN DE INCIDENTES', exact: true })
    ).toHaveCount(0);

    expect(pidioOperativos, 'el ciudadano llegó a pedir datos de operativos').toEqual([]);
  });
});
