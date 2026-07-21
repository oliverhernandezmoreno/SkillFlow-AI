import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
const base = 'http://127.0.0.1:3000/api/v1';
async function login(page: Page) {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Usar demo' }).click();
  await page.getByRole('button', { name: 'Ingresar' }).click();
}
async function context(page: Page, request: APIRequestContext) {
  await expect(page).toHaveURL(/\/dashboard$/);
  const raw = await page.evaluate(() => localStorage.getItem('skillflow-auth-session'));
  const token = JSON.parse(raw ?? '{}').state.accessToken as string;
  const headers = { Authorization: `Bearer ${token}` };
  let profile = await request.get(`${base}/otec-compliance/profile`, { headers });
  if (profile.status() === 404) {
    profile = await request.post(`${base}/otec-compliance/profile`, {
      headers,
      data: { registrationCode: 'PW-RC1' },
    });
    await page.reload();
  }
  expect(profile.ok()).toBeTruthy();
  return { headers, profileId: (await profile.json()).id as string };
}
test.describe.serial('OTEC completion RC1', () => {
  test('creates and reads a Resolution with backend persistence', async ({ page, request }) => {
    await login(page);
    const { headers, profileId } = await context(page, request);
    await page.goto('/otec-compliance/resolutions');
    await page.getByRole('button', { name: 'Crear resolución' }).click();
    await page.getByLabel('Número').fill('PW-RES-RC1');
    await page.getByLabel('Autoridad emisora').fill('Fictitious Authority');
    await page.getByLabel('Fecha de emisión').fill('2026-01-01');
    await page.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByText('PW-RES-RC1')).toBeVisible();
    await page.getByRole('button', { name: 'Ver detalle' }).click();
    await expect(page.getByText(/Detalle PW-RES-RC1/)).toBeVisible();

    const list = await request.get(`${base}/otec-compliance/resolutions?page=1&pageSize=20`, {
      headers,
    });
    const created = (await list.json()).data.find(
      (item: { resolutionNumber: string }) => item.resolutionNumber === 'PW-RES-RC1',
    );
    const current = await request.get(`${base}/otec-compliance/resolutions/${created.id}`, {
      headers,
    });
    const staleEtag = current.headers().etag!;
    const firstUpdate = await request.patch(`${base}/otec-compliance/resolutions/${created.id}`, {
      headers: { ...headers, 'If-Match': staleEtag },
      data: { issuingAuthority: 'Updated Authority' },
    });
    expect(firstUpdate.ok()).toBeTruthy();
    const staleUpdate = await request.patch(`${base}/otec-compliance/resolutions/${created.id}`, {
      headers: { ...headers, 'If-Match': staleEtag },
      data: { issuingAuthority: 'Stale Authority' },
    });
    expect(staleUpdate.status()).toBe(409);
    const replacement = await request.post(`${base}/otec-compliance/resolutions`, {
      headers,
      data: {
        otecProfileId: profileId,
        resolutionType: 'MODIFICATION',
        resolutionNumber: 'PW-RES-RC1-B',
        issuingAuthority: 'Fictitious Authority',
        issuedAt: '2026-02-01',
      },
    });
    expect(replacement.ok()).toBeTruthy();
    const replacementBody = await replacement.json();
    const refreshed = await request.get(`${base}/otec-compliance/resolutions/${created.id}`, {
      headers,
    });
    const supersession = await request.post(
      `${base}/otec-compliance/resolutions/${created.id}/supersession`,
      {
        headers: { ...headers, 'If-Match': refreshed.headers().etag! },
        data: {
          replacementResolutionId: replacementBody.id,
          replacementIfMatch: replacement.headers().etag!,
        },
      },
    );
    expect(supersession.ok()).toBeTruthy();
    const replacementCurrent = await request.get(
      `${base}/otec-compliance/resolutions/${replacementBody.id}`,
      { headers },
    );
    const deactivation = await request.post(
      `${base}/otec-compliance/resolutions/${replacementBody.id}/deactivation`,
      {
        headers: { ...headers, 'If-Match': replacementCurrent.headers().etag! },
        data: {},
      },
    );
    expect(deactivation.ok()).toBeTruthy();
  });
  test('renders backend-authoritative Readiness dashboard', async ({ page, request }) => {
    await login(page);
    await context(page, request);
    await page.goto('/otec-compliance/readiness');
    await expect(page.getByRole('heading', { name: 'Compliance Readiness' })).toBeVisible();
    await expect(page.getByText('Cumplimiento')).toBeVisible();
    await expect(page.getByText(/Evaluación interna/)).toBeVisible();
  });
  test('shows entitlement denial without dashboard data', async ({ page, request }) => {
    await login(page);
    await context(page, request);
    await page.route('**/api/v1/otec-compliance/compliance-summary?**', (route) =>
      route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ error: { code: 'MODULE_UNAVAILABLE', message: 'Unavailable' } }),
      }),
    );
    await page.goto('/otec-compliance/readiness');
    await expect(page.getByText('No se pudieron cargar los datos')).toBeVisible();
    await expect(page.getByText('Request failed with status 403')).toBeVisible();
    await expect(page.getByText('Cumplimiento')).toHaveCount(0);
  });
});
