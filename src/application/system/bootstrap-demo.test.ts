import type { Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';

import type { Environment } from '../../config/environment.js';
import { SystemController } from '../../interfaces/http/controllers/system.controller.js';

const summary = {
  organizationId: '00000000-0000-4000-8000-000000000001',
  adminUserId: '00000000-0000-4000-8000-000000000002',
  adminRoleId: '00000000-0000-4000-8000-000000000003',
  permissionCount: 52,
  employeeId: '00000000-0000-4000-8000-000000000004',
  courseId: '00000000-0000-4000-8000-000000000005',
  trainingPlanId: '00000000-0000-4000-8000-000000000006',
  trainingSessionId: '00000000-0000-4000-8000-000000000007',
  enrollmentId: '00000000-0000-4000-8000-000000000008',
  attendanceRecordId: '00000000-0000-4000-8000-000000000009',
  evaluationId: '00000000-0000-4000-8000-000000000010',
  evaluationQuestionId: '00000000-0000-4000-8000-000000000011',
  evaluationResponseId: '00000000-0000-4000-8000-000000000012',
  evaluationAnswerId: '00000000-0000-4000-8000-000000000013',
  certificateId: '00000000-0000-4000-8000-000000000014',
  senceDeclarationId: '00000000-0000-4000-8000-000000000015',
  organizationAlreadyExisted: false,
};

describe('System demo bootstrap endpoint controller', () => {
  it('hides the endpoint when demo bootstrap is disabled', async () => {
    const useCase = { execute: vi.fn().mockResolvedValue(summary) };
    const controller = new SystemController(createEnvironment({ ENABLE_DEMO_BOOTSTRAP: false }), useCase);
    const next = vi.fn();

    await invoke(controller, createRequest('expected-secret'), next);

    expect(next.mock.calls[0]?.[0]).toMatchObject({ statusCode: 404 });
    expect(useCase.execute).not.toHaveBeenCalled();
  });

  it('runs bootstrap without Authorization when the bootstrap secret is valid', async () => {
    const useCase = { execute: vi.fn().mockResolvedValue(summary) };
    const controller = new SystemController(createEnvironment(), useCase);
    const response = createResponse();
    const next = vi.fn();

    controller.bootstrapDemo(createRequest('expected-secret'), response, next);
    await Promise.resolve();

    expect(next).not.toHaveBeenCalled();
    expect(useCase.execute).toHaveBeenCalledWith({
      ipAddress: '127.0.0.1',
      userAgent: 'vitest',
    });
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({ status: 'ok', summary });
  });

  it('rejects requests without bootstrap secret', async () => {
    const useCase = { execute: vi.fn().mockResolvedValue(summary) };
    const controller = new SystemController(createEnvironment(), useCase);
    const next = vi.fn();

    await invoke(controller, createRequest(undefined), next);

    expect(next.mock.calls[0]?.[0]).toMatchObject({ statusCode: 403 });
    expect(useCase.execute).not.toHaveBeenCalled();
  });

  it('rejects requests with an invalid bootstrap secret', async () => {
    const useCase = { execute: vi.fn().mockResolvedValue(summary) };
    const controller = new SystemController(createEnvironment(), useCase);
    const next = vi.fn();

    await invoke(controller, createRequest('wrong-secret'), next);

    expect(next.mock.calls[0]?.[0]).toMatchObject({ statusCode: 403 });
    expect(useCase.execute).not.toHaveBeenCalled();
  });
});

function createEnvironment(overrides: Partial<Environment> = {}): Environment {
  return {
    NODE_ENV: 'production',
    PORT: 3000,
    DATABASE_URL: 'postgresql://postgres:postgres@localhost:5433/skillflow?schema=public',
    JWT_SECRET: 'development-access-token-secret-change-before-production',
    JWT_REFRESH_SECRET: 'development-refresh-token-secret-change-before-production',
    JWT_ACCESS_EXPIRES_IN: '15m',
    JWT_REFRESH_EXPIRES_IN: '7d',
    ALLOWED_ORIGINS: 'http://localhost:3001',
    ALLOWED_ORIGINS_LIST: ['http://localhost:3001'],
    JSON_PAYLOAD_LIMIT: '1mb',
    RATE_LIMIT_WINDOW_MS: 60000,
    RATE_LIMIT_MAX_REQUESTS: 300,
    ENABLE_DEMO_BOOTSTRAP: true,
    BOOTSTRAP_SECRET: 'expected-secret',
    ...overrides,
  };
}

function createRequest(secret: string | undefined): Request {
  return {
    ip: '127.0.0.1',
    header: (name: string) => (name === 'x-bootstrap-secret' ? secret : undefined),
    get: (name: string) => (name === 'user-agent' ? 'vitest' : undefined),
  } as Request;
}

function createResponse(): Response {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
}

async function invoke(controller: SystemController, request: Request, next: ReturnType<typeof vi.fn>) {
  controller.bootstrapDemo(request, createResponse(), next);
  await Promise.resolve();
}
