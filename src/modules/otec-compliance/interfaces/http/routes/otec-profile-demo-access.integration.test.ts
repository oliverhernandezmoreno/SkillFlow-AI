import express from 'express';
import { pinoHttp } from 'pino-http';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { prismaClient } from '../../../../../infrastructure/prisma/prisma-client.js';
import type { TokenService } from '../../../../auth/domain/services/token-service.js';
import { seedOtecCompliancePermissions } from '../../../infrastructure/prisma/seed-otec-compliance-permissions.js';
import { createOtecComplianceRouter } from './otec-compliance.routes.js';

const organizationId = '5be7caa5-91f8-4a4a-923b-70c8891ba9d0';
const actorUserId = 'b99db2ac-4b3e-46dd-8067-ea436c2fa315';
const roleId = 'a7464fcf-5280-4588-a9c0-188fb888eb3d';
const foreignOrganizationId = '5be7caa5-91f8-4a4a-923b-70c8891ba999';
const foreignActorUserId = 'b99db2ac-4b3e-46dd-8067-ea436c2fa999';
const permissions = ['otec_compliance.read', 'otec_compliance.profile.manage'];
const capturedError = vi.hoisted<{ value: unknown }>(() => ({ value: null }));

vi.mock('../contracts/otec-http-error-mapper.js', async (importOriginal) => {
  const actual = await importOriginal<
    typeof import('../contracts/otec-http-error-mapper.js')
  >();
  return {
    ...actual,
    mapOtecHttpError(error: unknown) {
      capturedError.value = error;
      return actual.mapOtecHttpError(error);
    },
  };
});

describe('demo OTEC profile creation integration', () => {
  beforeAll(async () => {
    await cleanFixture();
    await prismaClient.organization.create({
      data: {
        id: organizationId,
        legalName: 'Minera Andes Capacitación SpA',
        tradeName: 'Minera Andes Capacitación',
        taxId: '76.555.443-2',
        email: 'admin@skillflow.demo',
        type: 'CLIENT_COMPANY',
        status: 'ACTIVE',
        country: 'CL',
      },
    });
    await prismaClient.user.create({
      data: {
        id: actorUserId,
        organizationId,
        firstName: 'Demo',
        lastName: 'Admin',
        email: 'admin@skillflow.demo',
        normalizedEmail: 'admin@skillflow.demo',
        passwordHash: 'not-used-by-integration-test',
        status: 'ACTIVE',
      },
    });
    await prismaClient.role.create({
      data: {
        id: roleId,
        organizationId,
        code: 'demo-admin',
        name: 'Demo administrator',
      },
    });
    await prismaClient.userRole.create({
      data: { organizationId, userId: actorUserId, roleId },
    });
    await seedOtecCompliancePermissions(prismaClient, { organizationId, roleId });
    await prismaClient.organization.create({
      data: {
        id: foreignOrganizationId,
        legalName: 'Foreign integration OTEC',
        taxId: '76.555.442-4',
        email: 'foreign-otec@example.test',
        type: 'OTEC',
        status: 'ACTIVE',
      },
    });
    await prismaClient.user.create({
      data: {
        id: foreignActorUserId,
        organizationId: foreignOrganizationId,
        firstName: 'Foreign',
        lastName: 'Operator',
        email: 'foreign-operator@example.test',
        normalizedEmail: 'foreign-operator@example.test',
        passwordHash: 'not-used-by-integration-test',
      },
    });
    await prismaClient.tenantModuleEntitlement.create({
      data: {
        organizationId: foreignOrganizationId,
        moduleCode: 'OTEC_COMPLIANCE',
        status: 'ENABLED',
        enabledFeatures: [],
      },
    });
  });

  afterAll(async () => {
    await cleanFixture();
    await prismaClient.$disconnect();
  });

  it('creates a profile through the productive stack for the permission-bearing demo tenant', async () => {
    capturedError.value = null;
    const response = await request(realApp())
      .post('/api/v1/otec-compliance/profile')
      .set('Authorization', 'Bearer confirmed-production-claims')
      .send(profilePayload('OTEC-DEMO-001'));

    if (response.status === 403) {
      const original = capturedError.value instanceof Error ? capturedError.value : null;
      throw new Error(
        JSON.stringify(
          {
            originalClass: original?.constructor.name ?? null,
            originalMessage: original?.message ?? null,
            origin: original?.stack
              ?.split('\n')
              .find((line) => line.includes('/src/'))
              ?.trim() ?? null,
            stackBeforeHttpHandler: original?.stack ?? null,
            finalResponseBody: response.body as unknown,
          },
          null,
          2,
        ),
      );
    }

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ registrationCode: 'OTEC-DEMO-001', version: 1 });
    await expect(
      prismaClient.otecProfile.findFirst({ where: { organizationId, deletedAt: null } }),
    ).resolves.toMatchObject({ organizationId, registrationCode: 'OTEC-DEMO-001' });
  });

  it('returns 403 without profile management permission', async () => {
    const response = await request(realApp())
      .post('/api/v1/otec-compliance/profile')
      .set('Authorization', 'Bearer missing-profile-permission')
      .send(profilePayload('OTEC-DENIED'));

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      error: { code: 'FORBIDDEN', message: 'Permission denied' },
    });
    await expect(
      prismaClient.otecProfile.findFirst({
        where: { organizationId, registrationCode: 'OTEC-DENIED' },
      }),
    ).resolves.toBeNull();
  });

  it('creates only inside the authenticated tenant', async () => {
    const response = await request(realApp())
      .post('/api/v1/otec-compliance/profile')
      .set('Authorization', 'Bearer foreign-tenant')
      .send(profilePayload('OTEC-FOREIGN'));

    expect(response.status).toBe(201);
    await expect(
      prismaClient.otecProfile.findFirst({
        where: { organizationId: foreignOrganizationId, registrationCode: 'OTEC-FOREIGN' },
      }),
    ).resolves.toMatchObject({ organizationId: foreignOrganizationId });
    await expect(
      prismaClient.otecProfile.findFirst({
        where: { organizationId, registrationCode: 'OTEC-FOREIGN' },
      }),
    ).resolves.toBeNull();
  });
});

function realApp() {
  const app = express();
  app.use(pinoHttp({ enabled: false }));
  app.use(express.json());
  app.use('/api/v1', createOtecComplianceRouter({ tokenService: confirmedTokenService() }));
  return app;
}

function confirmedTokenService(): TokenService {
  return {
    createTokenPair: () => ({ accessToken: '', refreshToken: '' }),
    refresh: () => ({ accessToken: '', refreshToken: '' }),
    verify: (token) => ({
      userId: token === 'foreign-tenant' ? foreignActorUserId : actorUserId,
      organizationId: token === 'foreign-tenant' ? foreignOrganizationId : organizationId,
      roleIds: [roleId],
      permissions: token === 'missing-profile-permission' ? ['otec_compliance.read'] : permissions,
      type: 'access',
    }),
  };
}

function profilePayload(registrationCode: string) {
  return {
    registrationCode,
    rudoReference: null,
    technicalContactName: null,
    technicalContactEmail: null,
    technicalContactPhone: null,
    notes: null,
  };
}

async function cleanFixture(): Promise<void> {
  const organizationIds = [organizationId, foreignOrganizationId];
  await prismaClient.auditEvent.deleteMany({ where: { organizationId: { in: organizationIds } } });
  await prismaClient.otecProfile.deleteMany({ where: { organizationId: { in: organizationIds } } });
  await prismaClient.tenantModuleEntitlement.deleteMany({
    where: { organizationId: { in: organizationIds } },
  });
  await prismaClient.rolePermission.deleteMany({
    where: { organizationId: { in: organizationIds } },
  });
  await prismaClient.userRole.deleteMany({ where: { organizationId: { in: organizationIds } } });
  await prismaClient.role.deleteMany({ where: { organizationId: { in: organizationIds } } });
  await prismaClient.user.deleteMany({ where: { organizationId: { in: organizationIds } } });
  await prismaClient.organization.deleteMany({ where: { id: { in: organizationIds } } });
}
