import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

import { LegalRepresentativeController } from './legal-representative.controller.js';
import { OtecAccreditationController } from './otec-accreditation.controller.js';
import { OtecOfficeController } from './otec-office.controller.js';
import { OtecRecordController, type OtecRecordHandlers } from './otec-record.controller.js';
import { OtecResolutionController } from './otec-resolution.controller.js';
import { QualityCertificationController } from './quality-certification.controller.js';

const organizationId = '10000000-0000-4000-8000-000000000001';
const actorUserId = '10000000-0000-4000-8000-000000000002';
const resourceId = '10000000-0000-4000-8000-000000000003';
const replacementId = '10000000-0000-4000-8000-000000000004';
const controllerTypes = [
  ['accreditation', OtecAccreditationController],
  ['certification', QualityCertificationController],
  ['office', OtecOfficeController],
  ['representative', LegalRepresentativeController],
  ['resolution', OtecResolutionController],
] as const;

describe.each(controllerTypes)('%s HTTP controller', (_name, Controller) => {
  it('keeps create and list transport concerns thin and tenant-scoped', async () => {
    const handlers = createHandlers();
    const app = testApp(new Controller(handlers));

    const created = await request(app).post('/resources').send({ name: 'Valid resource' });
    const listed = await request(app).get('/resources?page=2&pageSize=5&status=ACTIVE');

    expect(created.status).toBe(201);
    expect(created.headers['etag']).toBe('W/"v1"');
    expect(created.body).not.toHaveProperty('organizationId');
    expect(handlers.create).toHaveBeenCalledWith(
      { name: 'Valid resource' },
      expect.objectContaining({ organizationId, actorUserId }),
    );
    expect(handlers.list).toHaveBeenCalledWith(
      { status: 'ACTIVE' },
      { page: 2, pageSize: 5 },
      expect.objectContaining({ organizationId }),
    );
    expect(listed.body).toEqual({ items: [], page: 2, pageSize: 5, total: 0 });
  });

  it('maps path identifiers and If-Match to the update handler', async () => {
    const handlers = createHandlers();
    const app = testApp(new Controller(handlers));

    const response = await request(app)
      .patch(`/resources/${resourceId}`)
      .set('If-Match', 'W/"v1"')
      .send({ name: 'Updated' });

    expect(response.status).toBe(200);
    expect(response.headers['etag']).toBe('W/"v2"');
    expect(handlers.update).toHaveBeenCalledWith(
      resourceId,
      { name: 'Updated', expectedVersion: 1 },
      expect.objectContaining({ organizationId }),
    );
  });
});

describe('specialized record transitions', () => {
  it('maps accreditation suspension and revocation to versioned handlers', async () => {
    const handlers = createHandlers();
    const app = testApp(new OtecAccreditationController(handlers));

    await request(app)
      .post(`/resources/${resourceId}/suspension`)
      .set('If-Match', 'W/"v1"')
      .send({ reason: 'Review' });
    await request(app)
      .post(`/resources/${resourceId}/revocation`)
      .set('If-Match', 'W/"v2"')
      .send({ reason: 'Revoked' });

    expect(handlers.suspend).toHaveBeenCalledWith(
      resourceId,
      { reason: 'Review', expectedVersion: 1 },
      expect.objectContaining({ organizationId }),
    );
    expect(handlers.revoke).toHaveBeenCalledWith(
      resourceId,
      { reason: 'Revoked', expectedVersion: 2 },
      expect.objectContaining({ organizationId }),
    );
  });

  it('requires independent versions for resolution supersession', async () => {
    const handlers = createHandlers();
    const app = testApp(new OtecResolutionController(handlers));

    const response = await request(app)
      .post(`/resources/${resourceId}/supersession`)
      .set('If-Match', 'W/"v3"')
      .send({ replacementResolutionId: replacementId, replacementIfMatch: 'W/"v5"' });

    expect(response.status).toBe(200);
    expect(response.headers['etag']).toBe('W/"v6"');
    expect(handlers.supersede).toHaveBeenCalledWith(
      {
        replacedResolutionId: resourceId,
        replacementResolutionId: replacementId,
        replacedExpectedVersion: 3,
        replacementExpectedVersion: 5,
      },
      expect.objectContaining({ organizationId }),
    );
  });
});

function createHandlers(): OtecRecordHandlers {
  return {
    create: vi.fn().mockResolvedValue(resource(1)),
    list: vi.fn().mockImplementation((_filters, pagination) =>
      Promise.resolve({ items: [], ...pagination, total: 0 }),
    ),
    get: vi.fn().mockResolvedValue(resource(1)),
    update: vi.fn().mockResolvedValue(resource(2)),
    deactivate: vi.fn().mockResolvedValue(resource(2)),
    suspend: vi.fn().mockResolvedValue(resource(2)),
    revoke: vi.fn().mockResolvedValue(resource(3)),
    supersede: vi.fn().mockResolvedValue({ response: { superseded: true }, version: 6 }),
  };
}

function testApp(controller: OtecRecordController) {
  const app = express();
  app.use(express.json());
  app.use((request, response, next) => {
    response.locals['auth'] = {
      userId: actorUserId,
      organizationId,
      permissions: ['otec_compliance.read'],
    };
    const page = Number(request.query['page'] ?? 1);
    const pageSize = Number(request.query['pageSize'] ?? 20);
    response.locals['validatedQuery'] = {
      page,
      pageSize,
      ...(request.query['status'] ? { status: request.query['status'] } : {}),
    };
    response.locals['validatedParams'] = { id: request.params['id'] ?? resourceId };
    next();
  });
  app.post('/resources', controller.create);
  app.get('/resources', controller.list);
  app.get('/resources/:id', controller.get);
  app.patch('/resources/:id', controller.update);
  app.post('/resources/:id/deactivation', controller.deactivate);
  app.post('/resources/:id/suspension', controller.suspend);
  app.post('/resources/:id/revocation', controller.revoke);
  app.post('/resources/:id/supersession', controller.supersede);
  return app;
}

function resource(version: number) {
  return {
    id: resourceId,
    organizationId,
    deletedAt: null,
    version,
  };
}
