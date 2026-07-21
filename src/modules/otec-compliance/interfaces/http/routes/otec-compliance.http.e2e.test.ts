import express from 'express';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { pinoHttp } from 'pino-http';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { prismaClient } from '../../../../../infrastructure/prisma/prisma-client.js';
import type { TokenService } from '../../../../auth/domain/services/token-service.js';
import { createOtecComplianceRouter } from './otec-compliance.routes.js';

const tenantA = '27000000-0000-4000-8000-000000000001';
const tenantB = '27000000-0000-4000-8000-000000000002';
const userA = '27100000-0000-4000-8000-000000000001';
const userB = '27100000-0000-4000-8000-000000000002';
const permissions = [
  'otec_compliance.read',
  'otec_compliance.profile.manage',
  'otec_compliance.accreditation.manage',
  'otec_compliance.certification.manage',
  'otec_compliance.office.manage',
  'otec_compliance.representative.manage',
  'otec_compliance.resolution.manage',
  'otec_compliance.readiness.evaluate',
];
const yaml = createRequire(import.meta.url)('js-yaml') as { load(source: string): unknown };
const otecOpenApi = yaml.load(
  readFileSync('docs/sence/OTEC_HTTP_CONTRACTS.openapi.yml', 'utf8'),
) as Record<string, unknown>;

describe('OTEC Compliance HTTP PostgreSQL E2E', () => {
  const app = realApp();
  let profileId: string;

  beforeAll(async () => {
    await cleanFixtures();
    await prismaClient.organization.createMany({
      data: [
        organization(tenantA, '76.777.771-1', 'a'),
        organization(tenantB, '76.777.772-K', 'b'),
      ],
    });
    await prismaClient.user.createMany({
      data: [user(userA, tenantA, 'a'), user(userB, tenantB, 'b')],
    });
    await prismaClient.tenantModuleEntitlement.createMany({
      data: [entitlement(tenantA), entitlement(tenantB)],
    });
  });

  afterAll(async () => {
    await cleanFixtures();
    await prismaClient.$disconnect();
  });

  it('creates the singleton profile and rejects a concurrent stale update', async () => {
    const created = await auth(request(app).post('/api/v1/otec-compliance/profile')).send({
      registrationCode: 'HTTP-E2E',
      notes: 'Created through the productive route',
    });
    profileId = String(responseBody(created)['id']);

    expect(created.status).toBe(201);
    expect(created.headers['etag']).toBe('W/"v1"');
    expect(created.body).not.toHaveProperty('organizationId');

    const results = await Promise.all([
      auth(request(app).patch('/api/v1/otec-compliance/profile'))
        .set('If-Match', 'W/"v1"')
        .send({ notes: 'First update' }),
      auth(request(app).patch('/api/v1/otec-compliance/profile'))
        .set('If-Match', 'W/"v1"')
        .send({ notes: 'Second update' }),
    ]);
    expect(results.map((result) => result.status).sort()).toEqual([200, 409]);
    await expect(
      prismaClient.otecProfile.findUniqueOrThrow({ where: { id: profileId } }),
    ).resolves.toMatchObject({ version: 2 });
  });

  it('creates and lists one tenant-scoped record for every regulatory resource', async () => {
    const resources = [
      [
        'accreditations',
        {
          otecProfileId: profileId,
          accreditationType: 'SENCE_REGISTRATION',
          accreditationNumber: 'HTTP-ACC-1',
          validFrom: '2026-01-01',
          validUntil: '2027-01-01',
        },
      ],
      [
        'quality-certifications',
        {
          otecProfileId: profileId,
          certificationType: 'NCH_2728',
          certificationNumber: 'HTTP-CERT-1',
          certifyingEntity: 'Fictitious E2E Certifier',
          validFrom: '2026-01-01',
          validUntil: '2027-01-01',
        },
      ],
      [
        'offices',
        {
          otecProfileId: profileId,
          officeCode: 'HTTP-HQ-1',
          name: 'Fictitious E2E Headquarters',
          officeType: 'HEADQUARTERS',
          street: 'Test Street 1',
          city: 'Santiago',
          commune: 'Santiago',
          region: 'Metropolitana',
          country: 'CL',
        },
      ],
      [
        'legal-representatives',
        {
          otecProfileId: profileId,
          firstName: 'Fictitious',
          lastName: 'Representative',
          taxId: '12.345.678-5',
          roleTitle: 'Legal Representative',
          validFrom: '2026-01-01',
          validUntil: '2027-01-01',
        },
      ],
      [
        'resolutions',
        {
          otecProfileId: profileId,
          resolutionType: 'AUTHORIZATION',
          resolutionNumber: 'HTTP-RES-1',
          issuingAuthority: 'Fictitious E2E Authority',
          issuedAt: '2026-01-01',
          validFrom: '2026-01-01',
          validUntil: '2027-01-01',
        },
      ],
    ] as const;

    for (const [path, body] of resources) {
      const created = await auth(request(app).post(`/api/v1/otec-compliance/${path}`)).send(body);
      const listed = await auth(
        request(app).get(`/api/v1/otec-compliance/${path}?page=1&pageSize=10`),
      );
      expect(created.status, path).toBe(201);
      expect(created.headers['etag'], path).toBe('W/"v1"');
      expect(listed.status, path).toBe(200);
      expect(responseBody(listed)['data'], path).toHaveLength(1);
    }
  });

  it('does not disclose a known identifier to another tenant', async () => {
    const own = await auth(request(app).get('/api/v1/otec-compliance/accreditations'));
    const ownData = responseBody(own)['data'] as Record<string, unknown>[];
    const knownId = String(ownData[0]?.['id']);

    const foreign = await auth(
      request(app).get(`/api/v1/otec-compliance/accreditations/${knownId}`),
      'tenant-b',
    );
    const missing = await auth(
      request(app).get(
        '/api/v1/otec-compliance/accreditations/27000000-0000-4000-8000-000000000099',
      ),
      'tenant-b',
    );

    expect(foreign.status).toBe(404);
    expect(foreign.body).toEqual(missing.body);
  });

  it('serves readiness, summary, and expiring projections without exposing activity validation', async () => {
    await prismaClient.otecComplianceSettings.create({
      data: {
        organizationId: tenantA,
        otecProfileId: profileId,
        effectiveFrom: new Date('2026-01-01T00:00:00.000Z'),
        requireNch2728: true,
        requiredResolutionTypes: ['AUTHORIZATION'],
        qualifyingOfficeTypes: ['HEADQUARTERS'],
      },
    });
    const readiness = await auth(
      request(app).post('/api/v1/otec-compliance/readiness/evaluations'),
    ).send({ otecProfileId: profileId, evaluationDate: '2026-07-17' });
    const summary = await auth(
      request(app).get(
        `/api/v1/otec-compliance/compliance-summary?otecProfileId=${profileId}&evaluationDate=2026-07-17`,
      ),
    );
    const expiring = await auth(
      request(app).get(
        `/api/v1/otec-compliance/expiring-items?otecProfileId=${profileId}&evaluationDate=2026-07-17&page=1&pageSize=20`,
      ),
    );
    const internalOnly = await auth(
      request(app).post('/api/v1/otec-compliance/activity-validation'),
    ).send({ otecProfileId: profileId });

    expect(readiness.status).toBe(200);
    expect(['READY', 'READY_WITH_WARNINGS', 'NOT_READY']).toContain(
      responseBody(readiness)['status'],
    );
    const findings = responseBody(readiness)['findings'] as Record<string, unknown>[];
    expect(findings.length).toBeGreaterThan(0);
    for (const finding of findings) {
      expectOpenApiFinding(finding);
      expect(finding['code']).toEqual(expect.any(String));
      expect(String(finding['code']).length).toBeGreaterThan(0);
      expect(finding).not.toHaveProperty('ruleCode');
    }
    expect(summary.status).toBe(200);
    expect(expiring.status).toBe(200);
    expect(internalOnly.status).toBe(404);
  });
});

function expectOpenApiFinding(finding: Record<string, unknown>): void {
  const components = otecOpenApi['components'] as Record<string, unknown>;
  const schemas = components['schemas'] as Record<string, unknown>;
  const schema = schemas['ReadinessFinding'] as Record<string, unknown>;
  const properties = schema['properties'] as Record<string, Record<string, unknown>>;
  const required = schema['required'] as string[];

  for (const property of required) expect(finding).toHaveProperty(property);
  for (const [property, definition] of Object.entries(properties)) {
    if (finding[property] !== undefined && definition['type'] === 'string') {
      expect(typeof finding[property], property).toBe('string');
    }
  }
}

function realApp() {
  const app = express();
  app.use(pinoHttp({ enabled: false }));
  app.use(express.json());
  app.use('/api/v1', createOtecComplianceRouter({ tokenService: fakeTokenService() }));
  return app;
}

function fakeTokenService(): TokenService {
  return {
    createTokenPair: () => ({ accessToken: '', refreshToken: '' }),
    refresh: () => ({ accessToken: '', refreshToken: '' }),
    verify: (token) => ({
      userId: token === 'tenant-b' ? userB : userA,
      organizationId: token === 'tenant-b' ? tenantB : tenantA,
      roleIds: [],
      permissions,
      type: 'access',
    }),
  };
}

function auth(testRequest: request.Test, token = 'tenant-a'): request.Test {
  return testRequest.set('Authorization', `Bearer ${token}`);
}

function responseBody(response: request.Response): Record<string, unknown> {
  return response.body as Record<string, unknown>;
}

function organization(id: string, taxId: string, suffix: string) {
  return {
    id,
    legalName: `Fictitious HTTP E2E OTEC ${suffix}`,
    taxId,
    email: `otec-http-${suffix}@example.test`,
    type: 'OTEC' as const,
    status: 'ACTIVE' as const,
  };
}

function user(id: string, organizationId: string, suffix: string) {
  return {
    id,
    organizationId,
    firstName: 'HTTP',
    lastName: 'Tester',
    email: `otec-http-user-${suffix}@example.test`,
    normalizedEmail: `otec-http-user-${suffix}@example.test`,
    passwordHash: 'not-a-real-password-hash',
  };
}

function entitlement(organizationId: string) {
  return {
    organizationId,
    moduleCode: 'OTEC_COMPLIANCE' as const,
    status: 'ENABLED' as const,
    enabledFeatures: [
      'profile',
      'accreditations',
      'certifications',
      'offices',
      'representatives',
      'resolutions',
      'readiness',
      'expirations',
    ],
  };
}

async function cleanFixtures(): Promise<void> {
  const organizations = [tenantA, tenantB];
  await prismaClient.auditEvent.deleteMany({ where: { organizationId: { in: organizations } } });
  await prismaClient.otecResolution.deleteMany({
    where: { organizationId: { in: organizations } },
  });
  await prismaClient.legalRepresentative.deleteMany({
    where: { organizationId: { in: organizations } },
  });
  await prismaClient.otecOffice.deleteMany({ where: { organizationId: { in: organizations } } });
  await prismaClient.qualityCertification.deleteMany({
    where: { organizationId: { in: organizations } },
  });
  await prismaClient.otecAccreditation.deleteMany({
    where: { organizationId: { in: organizations } },
  });
  await prismaClient.otecComplianceSettings.deleteMany({
    where: { organizationId: { in: organizations } },
  });
  await prismaClient.otecProfile.deleteMany({ where: { organizationId: { in: organizations } } });
  await prismaClient.tenantModuleEntitlement.deleteMany({
    where: { organizationId: { in: organizations } },
  });
  await prismaClient.user.deleteMany({ where: { organizationId: { in: organizations } } });
  await prismaClient.organization.deleteMany({ where: { id: { in: organizations } } });
}
