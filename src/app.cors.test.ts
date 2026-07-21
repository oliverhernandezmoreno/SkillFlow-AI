import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from './app.js';
import { loadEnvironment } from './config/environment.js';

describe('application CORS response metadata', () => {
  it('allows authorized browser clients to read ETag for optimistic concurrency', async () => {
    const environment = loadEnvironment({
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5433/skillflow?schema=public',
      JWT_SECRET: 'test-access-secret',
      JWT_REFRESH_SECRET: 'test-refresh-secret',
      ALLOWED_ORIGINS: 'http://localhost:3001',
    });

    const response = await request(createApp(environment))
      .options('/api/v1/otec-compliance/profile')
      .set('Origin', 'http://localhost:3001')
      .set('Access-Control-Request-Method', 'PATCH')
      .set('Access-Control-Request-Headers', 'Authorization,Content-Type,If-Match');

    expect(response.status).toBe(204);
    expect(response.headers['access-control-expose-headers']).toContain('ETag');
  });
});
