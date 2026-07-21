import { expect, test, type Page } from '@playwright/test';

const apiUrl = 'http://127.0.0.1:3000/api/v1';

async function login(page: Page) {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Usar demo' }).click();
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test.describe.serial('OtecProfile vertical slice', () => {
  test('creates, updates, handles stale ETag, and deactivates the tenant singleton', async ({ page, request }) => {
    await login(page);
    const storage = await page.evaluate(() => localStorage.getItem('skillflow-auth-session'));
    const token = JSON.parse(storage ?? '{}').state.accessToken as string;
    const headers = { Authorization: `Bearer ${token}` };

    const existing = await request.get(`${apiUrl}/otec-compliance/profile`, { headers });
    if (existing.ok()) {
      const etag = existing.headers()['etag'];
      await request.post(`${apiUrl}/otec-compliance/profile/deactivation`, { headers: { ...headers, 'If-Match': etag }, data: {} });
    }

    await page.goto('/otec-compliance/profile');
    await expect(page.getByText('Aún no existe un perfil OTEC')).toBeVisible();
    await page.getByRole('button', { name: 'Crear perfil OTEC' }).click();
    await page.getByLabel('Código de registro').fill('PW-OTEC-001');
    await page.getByLabel('Nombre de contacto técnico').fill('Playwright Profile');
    await page.getByRole('button', { name: 'Crear perfil OTEC' }).click();
    await expect(page.getByText('PW-OTEC-001')).toBeVisible();

    const current = await request.get(`${apiUrl}/otec-compliance/profile`, { headers });
    const staleEtag = current.headers()['etag'];
    expect(staleEtag).toMatch(/^W\/"v\d+"$/);

    await page.getByRole('button', { name: 'Editar perfil' }).click();
    await page.getByLabel('Notas').fill('Safe browser draft');
    const external = await request.patch(`${apiUrl}/otec-compliance/profile`, {
      headers: { ...headers, 'If-Match': staleEtag }, data: { notes: 'External concurrent update' },
    });
    expect(external.status()).toBe(200);
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(page.getByText(/El perfil fue actualizado por otra sesión/)).toBeVisible();
    await expect(page.getByLabel('Notas')).toHaveValue('Safe browser draft');

    await page.getByRole('button', { name: 'Cancelar' }).click();
    await page.getByRole('button', { name: 'Desactivar perfil' }).click();
    await expect(page.getByRole('dialog')).toContainText('preparación operacional');
    await page.getByRole('button', { name: 'Confirmar desactivación' }).click();
    await expect(page.getByText('Aún no existe un perfil OTEC')).toBeVisible();
  });

  test('shows read-only and module-unavailable browser states', async ({ page }) => {
    await login(page);
    await page.route('**/api/v1/otec-compliance/profile', async (route) => {
      await route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ error: { code: 'MODULE_UNAVAILABLE', message: 'Unavailable' } }) });
    });
    await page.goto('/otec-compliance/profile');
    await expect(page.getByText('Módulo OTEC no disponible')).toBeVisible();
    await expect(page.getByRole('button', { name: /editar|desactivar|crear perfil/i })).toHaveCount(0);
  });
});
