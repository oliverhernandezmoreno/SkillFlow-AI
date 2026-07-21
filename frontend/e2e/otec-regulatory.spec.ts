import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

const apiUrl = 'http://127.0.0.1:3000/api/v1';
async function login(page: Page) { await page.goto('/login'); await page.getByRole('button', { name: 'Usar demo' }).click(); await page.getByRole('button', { name: 'Ingresar' }).click(); await expect(page).toHaveURL(/\/dashboard$/); }
async function token(page: Page) { const storage = await page.evaluate(() => localStorage.getItem('skillflow-auth-session')); return JSON.parse(storage ?? '{}').state.accessToken as string; }
async function ensureProfile(request: APIRequestContext, authorization: string) {
  const headers = { Authorization: `Bearer ${authorization}` };
  let response = await request.get(`${apiUrl}/otec-compliance/profile`, { headers });
  if (response.status() === 404) response = await request.post(`${apiUrl}/otec-compliance/profile`, { headers, data: { registrationCode: 'PW-SLICE-2' } });
  expect(response.ok()).toBeTruthy();
}

test.describe.serial('OTEC regulatory records vertical slice', () => {
  test('creates, edits with stale protection, and revokes an accreditation', async ({ page, request }) => {
    await login(page); const accessToken = await token(page); const headers = { Authorization: `Bearer ${accessToken}` }; await ensureProfile(request, accessToken);
    await page.goto('/otec-compliance/accreditations');
    await page.getByRole('button', { name: 'Crear acreditación' }).click();
    await page.getByLabel('Tipo de acreditación').fill('INTERNAL_PLAYWRIGHT'); await page.getByLabel('Número de acreditación').fill('PW-ACC-SLICE-2'); await page.getByLabel('Válida desde').fill('2026-01-01'); await page.getByLabel('Válida hasta').fill('2027-01-01'); await page.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByText('PW-ACC-SLICE-2')).toBeVisible(); await page.getByRole('button', { name: 'Ver detalle' }).click(); await page.getByRole('button', { name: 'Editar' }).click(); await page.getByLabel('Notas').fill('Safe accreditation draft');
    const list = await request.get(`${apiUrl}/otec-compliance/accreditations?page=1&pageSize=100`, { headers }); const item = (await list.json()).data.find((value: { accreditationNumber: string }) => value.accreditationNumber === 'PW-ACC-SLICE-2'); const current = await request.get(`${apiUrl}/otec-compliance/accreditations/${item.id}`, { headers });
    const external = await request.patch(`${apiUrl}/otec-compliance/accreditations/${item.id}`, { headers: { ...headers, 'If-Match': current.headers()['etag'] }, data: { notes: 'External accreditation update' } }); expect(external.status()).toBe(200);
    await page.getByRole('button', { name: 'Guardar' }).click(); await expect(page.getByText(/El registro fue actualizado por otra sesión/)).toBeVisible(); await expect(page.getByLabel('Notas')).toHaveValue('Safe accreditation draft'); await page.getByRole('button', { name: 'Cancelar' }).click();
    await page.getByRole('button', { name: 'Revocar' }).click(); await page.getByRole('button', { name: 'Confirmar' }).click(); await expect(page.getByText(/revocado/i)).toBeVisible();
  });

  test('creates, edits with stale protection, and deactivates a quality certification', async ({ page, request }) => {
    await login(page); const accessToken = await token(page); const headers = { Authorization: `Bearer ${accessToken}` }; await ensureProfile(request, accessToken);
    await page.goto('/otec-compliance/quality-certifications'); await page.getByRole('button', { name: 'Crear certificación' }).click(); await page.getByLabel('Tipo de certificación').selectOption('NCH_2728'); await page.getByLabel('Número de certificación').fill('PW-CERT-SLICE-2'); await page.getByLabel('Entidad certificadora').fill('Fictitious Playwright Entity'); await page.getByLabel('Válida hasta').fill('2027-12-31'); await page.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByText('PW-CERT-SLICE-2')).toBeVisible(); await page.getByRole('button', { name: 'Ver detalle' }).click(); await page.getByRole('button', { name: 'Editar' }).click(); await page.getByLabel('Alcance').fill('Safe certification draft');
    const list = await request.get(`${apiUrl}/otec-compliance/quality-certifications?page=1&pageSize=100`, { headers }); const item = (await list.json()).data.find((value: { certificationNumber: string }) => value.certificationNumber === 'PW-CERT-SLICE-2'); const current = await request.get(`${apiUrl}/otec-compliance/quality-certifications/${item.id}`, { headers });
    const external = await request.patch(`${apiUrl}/otec-compliance/quality-certifications/${item.id}`, { headers: { ...headers, 'If-Match': current.headers()['etag'] }, data: { scope: 'External certification update' } }); expect(external.status()).toBe(200);
    await page.getByRole('button', { name: 'Guardar' }).click(); await expect(page.getByText(/El registro fue actualizado por otra sesión/)).toBeVisible(); await expect(page.getByLabel('Alcance')).toHaveValue('Safe certification draft'); await page.getByRole('button', { name: 'Cancelar' }).click(); await page.getByRole('button', { name: 'Desactivar' }).click(); await page.getByRole('button', { name: 'Confirmar' }).click();
  });

  test('shows module-unavailable without management controls', async ({ page }) => {
    await login(page); await page.route('**/api/v1/otec-compliance/accreditations?**', (route) => route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ error: { code: 'MODULE_UNAVAILABLE', message: 'Unavailable' } }) })); await page.goto('/otec-compliance/accreditations'); await expect(page.getByText('Módulo OTEC no disponible')).toBeVisible(); await expect(page.getByRole('button', { name: /crear|editar|suspender|revocar/i })).toHaveCount(0);
  });
});
