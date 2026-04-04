const fs = require('fs');
const path = require('path');

const playwrightModule =
  process.env.SIGCE_PLAYWRIGHT_PATH ||
  'playwright';
const { chromium } = require(playwrightModule);

const baseUrl = process.env.SIGCE_BASE_URL || 'http://127.0.0.1:3000';
const email = process.env.SIGCE_LOGIN_EMAIL;
const password = process.env.SIGCE_LOGIN_PASSWORD;
const loginRole = process.env.SIGCE_LOGIN_ROLE === 'admin' ? 'admin' : 'student';
const onlyRoutes = new Set(
  (process.env.SIGCE_CAPTURE_ONLY || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
);

if (!email || !password) {
  throw new Error('SIGCE_LOGIN_EMAIL y SIGCE_LOGIN_PASSWORD son obligatorios.');
}

const repoRoot = path.resolve(__dirname, '..');
const artifactsDir = path.join(repoRoot, 'docs', 'manual_assets');

fs.mkdirSync(artifactsDir, { recursive: true });

const captures = [
  {
    route: '/dashboard',
    file: 'manual_dashboard_2026-04-03.png',
    waitFor: 'text=Resumen',
    waitForGone: 'text=Cargando dashboard',
    settleMs: 2500,
  },
  {
    route: '/dashboard/campuses',
    file: 'manual_campuses_2026-04-03.png',
    waitFor: 'text=Recintos',
  },
  {
    route: '/dashboard/signers',
    file: 'manual_signers_2026-04-03.png',
    waitFor: 'text=Firmantes Autorizados',
  },
  {
    route: '/dashboard/certificate-templates',
    file: 'manual_templates_2026-04-03.png',
    waitFor: 'text=Plantillas de Certificado',
  },
  {
    route: '/dashboard/programs',
    file: 'manual_programs_2026-04-03.png',
    waitFor: 'text=Programas Académicos',
    waitForGone: 'text=Cargando programas',
    settleMs: 2500,
  },
  {
    route: '/dashboard/graduates',
    file: 'manual_participants_2026-04-03.png',
    waitFor: 'text=Participantes',
    waitForGone: 'text=Cargando participantes',
    settleMs: 2500,
  },
  {
    route: '/dashboard/graduates/import',
    file: 'manual_participants_import_2026-04-03.png',
    waitFor: 'text=Importacion de Participantes',
  },
  {
    route: '/dashboard/certificates',
    file: 'manual_certificates_2026-04-03.png',
    waitFor: 'text=Certificados',
  },
  {
    route: '/dashboard/certificates/create',
    file: 'manual_certificates_create_2026-04-03.png',
    waitFor: 'text=Nuevo Certificado',
  },
  {
    route: '/dashboard/certificates/import',
    file: 'manual_certificates_import_2026-04-03.png',
    waitFor: 'text=Carga Masiva de Certificados',
  },
  {
    route: '/dashboard/certificate-states',
    file: 'manual_certificate_states_2026-04-03.png',
    waitFor: 'text=Estados de Certificados',
  },
  {
    route: '/dashboard/digital-signatures',
    file: 'manual_digital_signatures_2026-04-03.png',
    waitFor: 'text=Firmas Digitales',
  },
  {
    route: '/dashboard/users',
    file: 'manual_users_2026-04-03.png',
    waitFor: 'text=Usuarios Internos',
  },
  {
    route: '/dashboard/data-integrity',
    file: 'manual_integrity_2026-04-03.png',
    waitFor: 'text=Integridad de Datos',
  },
];

const capturePlan =
  onlyRoutes.size === 0
    ? captures
    : captures.filter(
        (capture) =>
          onlyRoutes.has(capture.route) ||
          onlyRoutes.has(capture.file)
      );

async function save(page, file) {
  await page.screenshot({
    path: path.join(artifactsDir, file),
    fullPage: true,
  });
}

async function waitForOptionalHide(page, selector, timeout = 30000) {
  if (!selector) return;
  try {
    await page.locator(selector).first().waitFor({ state: 'hidden', timeout });
  } catch {
    // Deja seguir si el loader no aparece o tarda demasiado.
  }
}

async function main() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 1600 },
  });

  const page = await context.newPage();
  page.setDefaultNavigationTimeout(60000);
  page.setDefaultTimeout(45000);

  await page.goto(`${baseUrl}/login`, { waitUntil: 'commit', timeout: 60000 });
  await page.locator('#email').waitFor({ timeout: 30000 });
  await save(page, 'manual_login_2026-04-03.png');

  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);

  if (loginRole === 'admin') {
    await page.getByRole('button', { name: /^Administrador$/i }).click();
    await page.getByRole('button', { name: /Entrar como Admin/i }).click();
  } else {
    await page.getByRole('button', { name: /Entrar como Participante/i }).click();
  }

  try {
    await page.waitForURL(/\/(dashboard|student)/, { timeout: 30000 });
  } catch (error) {
    const loginError =
      (await page.locator('text=Credenciales incorrectas').first().textContent().catch(() => null)) ||
      (await page.locator('text=Error al iniciar sesión').first().textContent().catch(() => null)) ||
      (await page.locator('text=Esta cuenta no tiene permisos administrativos').first().textContent().catch(() => null)) ||
      'No se completó el login automático.';
    throw new Error(loginError);
  }

  if (!page.url().includes('/dashboard')) {
    throw new Error(`La cuenta inició sesión, pero no llegó al panel administrativo. URL actual: ${page.url()}`);
  }

  await page.locator('text=Resumen').first().waitFor({ timeout: 30000 });

  if (capturePlan.length === 0) {
    throw new Error('SIGCE_CAPTURE_ONLY no coincide con ninguna ruta o archivo conocido.');
  }

  for (const capture of capturePlan) {
    await page.goto(`${baseUrl}${capture.route}`, { waitUntil: 'commit', timeout: 60000 });
    await page.locator(capture.waitFor).first().waitFor({ timeout: 30000 });
    await waitForOptionalHide(page, capture.waitForGone);
    await page.waitForTimeout(capture.settleMs || 1200);
    await save(page, capture.file);
  }

  await browser.close();

  console.log(artifactsDir);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
