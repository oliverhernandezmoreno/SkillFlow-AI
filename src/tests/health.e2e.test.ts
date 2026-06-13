import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../app.js';

interface HealthResponseBody {
  status: 'ok';
  timestamp: string;
}

describe('GET /health', () => {
  it('returns the API health status defined by the OpenAPI contract', async () => {
    const app = createApp();

    const response = await request(app).get('/health').expect(200);
    const body = response.body as HealthResponseBody;

    expect(body).toEqual({
      status: 'ok',
      timestamp: expect.any(String) as string,
    });
    expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
  });
});
