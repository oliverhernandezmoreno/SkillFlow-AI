import express from 'express';
import { pinoHttp } from 'pino-http';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { TokenService } from '../../../../auth/domain/services/token-service.js';
import { ConflictError, NotFoundError } from '../../../../../shared/domain/errors.js';
import { LegalRepresentativeController } from '../controllers/legal-representative.controller.js';
import { OtecAccreditationController } from '../controllers/otec-accreditation.controller.js';
import { OtecComplianceQueryController } from '../controllers/otec-compliance-query.controller.js';
import { OtecOfficeController } from '../controllers/otec-office.controller.js';
import { OtecProfileController } from '../controllers/otec-profile.controller.js';
import { OtecResolutionController } from '../controllers/otec-resolution.controller.js';
import { QualityCertificationController } from '../controllers/quality-certification.controller.js';
import {
  OTEC_HTTP_ROUTE_MANIFEST,
  type OtecHttpMethod,
} from '../contracts/otec-http-route-manifest.js';
import { createOtecComplianceRouter } from './otec-compliance.routes.js';

const organizationId = '10000000-0000-4000-8000-000000000001';
const userId = '10000000-0000-4000-8000-000000000002';
const profileId = '10000000-0000-4000-8000-000000000003';
const allPermissions = [
  'otec_compliance.read',
  'otec_compliance.profile.manage',
  'otec_compliance.accreditation.manage',
  'otec_compliance.certification.manage',
  'otec_compliance.office.manage',
  'otec_compliance.representative.manage',
  'otec_compliance.resolution.manage',
  'otec_compliance.readiness.evaluate',
];
const createProfile = vi.fn();
const getProfile = vi.fn();
const updateProfile = vi.fn();
const access = { evaluate: vi.fn() };

describe('OTEC Compliance productive router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    access.evaluate.mockResolvedValue({ allowed: true, reason: 'ENABLED' });
    createProfile.mockResolvedValue(profile(1));
    getProfile.mockResolvedValue(profile(3));
    updateProfile.mockResolvedValue(profile(4));
  });

  it('requires authentication before evaluating module access', async () => {
    const response = await request(testApp()).get('/otec-compliance/profile');

    expect(response.status).toBe(401);
    expect(access.evaluate).not.toHaveBeenCalled();
  });

  it('registers every operation in the canonical productive route manifest', async () => {
    for (const operation of OTEC_HTTP_ROUTE_MANIFEST) {
      const concretePath = operation.path.replace('{id}', profileId);
      const response = await unauthenticatedRequest(operation.method, testApp(), concretePath);
      expect(response.status, `${operation.method.toUpperCase()} ${operation.path}`).toBe(401);
    }
  });

  it('returns a sanitized module denial before invoking the controller', async () => {
    access.evaluate.mockResolvedValue({ allowed: false, reason: 'FEATURE_DISABLED' });

    const response = await authenticated(request(testApp()).get('/otec-compliance/profile'));

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      error: { code: 'MODULE_UNAVAILABLE', message: 'OTEC Compliance module unavailable' },
    });
    expect(getProfile).not.toHaveBeenCalled();
  });

  it('enforces permissions after entitlement', async () => {
    const response = await authenticated(
      request(testApp([])).get('/otec-compliance/profile'),
    );

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: { code: 'FORBIDDEN', message: 'Permission denied' } });
    expect(getProfile).not.toHaveBeenCalled();
  });

  it('keeps profile creation forbidden without profile.manage', async () => {
    const response = await authenticated(
      request(testApp(['otec_compliance.read']))
        .post('/otec-compliance/profile')
        .send({ registrationCode: 'OTEC-INTERNAL-001' }),
    );

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: { code: 'FORBIDDEN', message: 'Permission denied' } });
    expect(createProfile).not.toHaveBeenCalled();
  });

  it('allows profile creation to reach the use case with profile.manage', async () => {
    const response = await authenticated(
      request(testApp(['otec_compliance.profile.manage']))
        .post('/otec-compliance/profile')
        .send({ registrationCode: 'OTEC-INTERNAL-001' }),
    );

    expect(response.status).toBe(201);
    expect(createProfile).toHaveBeenCalledOnce();
  });

  it('uses authenticated tenant context and emits a weak version ETag', async () => {
    const response = await authenticated(
      request(testApp()).get('/otec-compliance/profile').set('X-Correlation-Id', 'trace-123'),
    );

    expect(response.status).toBe(200);
    expect(response.headers['etag']).toBe('W/"v3"');
    expect(response.body).not.toHaveProperty('organizationId');
    expect(getProfile).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId, actorUserId: userId, correlationId: 'trace-123' }),
    );
  });

  it('rejects unknown tenant fields and never forwards them to a use case', async () => {
    const response = await authenticated(
      request(testApp())
        .post('/otec-compliance/profile')
        .send({ organizationId, notes: 'attempted override' }),
    );

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ error: { code: 'VALIDATION_ERROR' } });
  });

  it('maps If-Match to expectedVersion and returns the incremented ETag', async () => {
    const response = await authenticated(
      request(testApp())
        .patch('/otec-compliance/profile')
        .set('If-Match', 'W/"v3"')
        .send({ notes: 'Updated' }),
    );

    expect(response.status).toBe(200);
    expect(response.headers['etag']).toBe('W/"v4"');
    expect(updateProfile).toHaveBeenCalledWith(
      { notes: 'Updated', expectedVersion: 3 },
      expect.objectContaining({ organizationId }),
    );
  });

  it('rejects missing If-Match and maps stale versions to conflict', async () => {
    const missing = await authenticated(
      request(testApp()).patch('/otec-compliance/profile').send({ notes: 'Updated' }),
    );
    updateProfile.mockRejectedValueOnce(new ConflictError('stale version 3'));
    const stale = await authenticated(
      request(testApp())
        .patch('/otec-compliance/profile')
        .set('If-Match', 'W/"v2"')
        .send({ notes: 'Updated' }),
    );

    expect(missing.status).toBe(400);
    expect(missing.body).toMatchObject({
      error: { code: 'BAD_REQUEST', message: 'Request validation failed' },
    });
    expect(stale.status).toBe(409);
    expect(stale.body).toMatchObject({
      error: {
        code: 'CONFLICT',
        message: 'The operation conflicts with current state',
      },
    });
  });

  it('rejects malformed pagination and malformed If-Match at transport', async () => {
    const pagination = await authenticated(
      request(testApp()).get('/otec-compliance/offices?page=0&pageSize=101'),
    );
    const version = await authenticated(
      request(testApp())
        .patch('/otec-compliance/profile')
        .set('If-Match', '3')
        .send({ notes: 'Updated' }),
    );

    expect(pagination.status).toBe(400);
    expect(pagination.body).toMatchObject({ error: { code: 'VALIDATION_ERROR' } });
    expect(version.status).toBe(400);
    expect(version.body).toMatchObject({ error: { code: 'BAD_REQUEST' } });
  });

  it('makes missing and foreign resources non-disclosing and sanitizes unexpected errors', async () => {
    getProfile.mockRejectedValueOnce(new NotFoundError(`profile ${profileId} in ${organizationId}`));
    const missing = await authenticated(request(testApp()).get('/otec-compliance/profile'));
    getProfile.mockRejectedValueOnce(new Error('Prisma table otec_profiles cardinality violation'));
    const unexpected = await authenticated(request(testApp()).get('/otec-compliance/profile'));

    expect(missing.status).toBe(404);
    expect(missing.body).toEqual({ error: { code: 'NOT_FOUND', message: 'Resource not found' } });
    expect(JSON.stringify(missing.body)).not.toContain(organizationId);
    expect(unexpected.status).toBe(500);
    expect(unexpected.body).toEqual({
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Internal Server Error' },
    });
    expect(JSON.stringify(unexpected.body)).not.toContain('Prisma');
  });
});

function testApp(permissions = allPermissions) {
  const profileController = new OtecProfileController({
    create: { execute: createProfile },
    get: { execute: getProfile },
    update: { execute: updateProfile },
    deactivate: { execute: vi.fn().mockResolvedValue(undefined) },
  });
  const recordHandlers = {
    create: vi.fn().mockResolvedValue(profile(1)),
    list: vi.fn().mockResolvedValue({ items: [], page: 1, pageSize: 20, total: 0 }),
    get: vi.fn().mockResolvedValue(profile(1)),
    update: vi.fn().mockResolvedValue(profile(2)),
    deactivate: vi.fn().mockResolvedValue(profile(2)),
    suspend: vi.fn().mockResolvedValue(profile(2)),
    revoke: vi.fn().mockResolvedValue(profile(2)),
    supersede: vi.fn().mockResolvedValue({ response: profile(2), version: 2 }),
  };
  const queryHandlers = {
    evaluate: vi.fn().mockResolvedValue({ status: 'READY' }),
    summary: vi.fn().mockResolvedValue({ status: 'READY' }),
    expiring: vi.fn().mockResolvedValue({ items: [], page: 1, pageSize: 20, total: 0 }),
  };
  const app = express();
  app.use(pinoHttp({ enabled: false }));
  app.use(express.json());
  app.use(
    createOtecComplianceRouter({
      tokenService: tokenService(permissions),
      access,
      controllers: {
        profile: profileController,
        accreditation: new OtecAccreditationController(recordHandlers),
        certification: new QualityCertificationController(recordHandlers),
        office: new OtecOfficeController(recordHandlers),
        representative: new LegalRepresentativeController(recordHandlers),
        resolution: new OtecResolutionController(recordHandlers),
        query: new OtecComplianceQueryController(queryHandlers),
      },
    }),
  );
  return app;
}

function tokenService(permissions: string[]): TokenService {
  return {
    createTokenPair: vi.fn(),
    refresh: vi.fn(),
    verify: vi.fn().mockReturnValue({
      userId,
      organizationId,
      roleIds: [],
      permissions,
      type: 'access',
    }),
  };
}

function authenticated(testRequest: request.Test): request.Test {
  return testRequest.set('Authorization', 'Bearer valid-token');
}

function unauthenticatedRequest(method: OtecHttpMethod, app: ReturnType<typeof testApp>, path: string) {
  if (method === 'get') return request(app).get(path);
  if (method === 'post') return request(app).post(path);
  return request(app).patch(path);
}

function profile(version: number) {
  return {
    id: profileId,
    organizationId,
    registrationStatus: 'ACTIVE',
    deletedAt: null,
    version,
  };
}
