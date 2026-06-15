import request from 'supertest';
import { describe, it } from 'vitest';

import { createApp } from '../app.js';
import { User } from '../modules/users/domain/entities/user.entity.js';
import { JwtTokenService } from '../modules/auth/infrastructure/services/jwt-token.service.js';

const organizationId = '11111111-1111-4111-8111-111111111111';

function createAccessToken(permissions: string[]): string {
  const user = User.create({
    organizationId,
    firstName: 'Security',
    lastName: 'Tester',
    email: 'security@example.com',
    passwordHash: 'hashed-password',
  });

  return new JwtTokenService().createTokenPair(user, permissions).accessToken;
}

describe('HTTP security', () => {
  it('rejects employees endpoint without JWT', async () => {
    await request(createApp()).get('/api/v1/employees').expect(401);
  });

  it('rejects employees endpoint with insufficient permission', async () => {
    await request(createApp())
      .get('/api/v1/employees')
      .set('Authorization', `Bearer ${createAccessToken(['courses.read'])}`)
      .expect(403);
  });

  it('rejects courses endpoint without JWT', async () => {
    await request(createApp()).get('/api/v1/courses').expect(401);
  });

  it('rejects courses endpoint with insufficient permission', async () => {
    await request(createApp())
      .get('/api/v1/courses')
      .set('Authorization', `Bearer ${createAccessToken(['employees.read'])}`)
      .expect(403);
  });

  it('rejects enrollments endpoint without JWT', async () => {
    await request(createApp()).get('/api/v1/enrollments').expect(401);
  });

  it('rejects enrollments endpoint with insufficient permission', async () => {
    await request(createApp())
      .get('/api/v1/enrollments')
      .set('Authorization', `Bearer ${createAccessToken(['courses.read'])}`)
      .expect(403);
  });

  it('rejects attendance endpoint without JWT', async () => {
    await request(createApp()).get('/api/v1/attendance').expect(401);
  });

  it('rejects attendance endpoint with insufficient permission', async () => {
    await request(createApp())
      .get('/api/v1/attendance')
      .set('Authorization', `Bearer ${createAccessToken(['courses.read'])}`)
      .expect(403);
  });
});
