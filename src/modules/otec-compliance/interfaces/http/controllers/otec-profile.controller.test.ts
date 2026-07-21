import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

import { OtecProfileController } from './otec-profile.controller.js';

const profile = {
  id: '10000000-0000-4000-8000-000000000010',
  organizationId: '10000000-0000-4000-8000-000000000001',
  registrationStatus: 'ACTIVE',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  deletedAt: null,
  version: 3,
};

describe('OtecProfileController', () => {
  it('gets the tenant singleton without accepting profileId and returns ETag', async () => {
    const get = vi.fn().mockResolvedValue(profile);
    const app = testApp(new OtecProfileController({ get: { execute: get } }));

    const response = await request(app).get('/profile?profileId=foreign');

    expect(response.status).toBe(200);
    expect(response.headers['etag']).toBe('W/"v3"');
    expect(response.body).not.toHaveProperty('organizationId');
    expect(response.body).not.toHaveProperty('deletedAt');
    expect(get).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: profile.organizationId,
        actorUserId: '10000000-0000-4000-8000-000000000002',
        permissions: ['otec_compliance.read', 'otec_compliance.profile.manage'],
      }),
    );
  });

  it('maps If-Match only to expectedVersion for singleton update', async () => {
    const update = vi.fn().mockResolvedValue({ ...profile, version: 4 });
    const app = testApp(new OtecProfileController({ update: { execute: update } }));

    const response = await request(app)
      .patch('/profile')
      .set('If-Match', 'W/"v3"')
      .send({ notes: 'Updated' });

    expect(response.status).toBe(200);
    expect(response.headers['etag']).toBe('W/"v4"');
    expect(update).toHaveBeenCalledWith(
      { notes: 'Updated', expectedVersion: 3 },
      expect.objectContaining({ organizationId: profile.organizationId }),
    );
  });

  it('deactivates the singleton with If-Match and returns 204', async () => {
    const deactivate = vi.fn().mockResolvedValue(undefined);
    const app = testApp(new OtecProfileController({ deactivate: { execute: deactivate } }));

    const response = await request(app)
      .post('/profile/deactivation')
      .set('If-Match', 'W/"v3"')
      .send({});

    expect(response.status).toBe(204);
    expect(deactivate).toHaveBeenCalledWith(
      { expectedVersion: 3 },
      expect.objectContaining({ organizationId: profile.organizationId }),
    );
  });
});

function testApp(controller: OtecProfileController) {
  const app = express();
  app.use(express.json());
  app.use((_request, response, next) => {
    response.locals['auth'] = {
      userId: '10000000-0000-4000-8000-000000000002',
      organizationId: profile.organizationId,
      permissions: ['otec_compliance.read', 'otec_compliance.profile.manage'],
    };
    next();
  });
  app.get('/profile', controller.get);
  app.patch('/profile', controller.update);
  app.post('/profile/deactivation', controller.deactivate);
  return app;
}
