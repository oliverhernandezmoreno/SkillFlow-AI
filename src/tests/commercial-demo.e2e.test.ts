import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createApp } from '../app.js';
import { prismaClient } from '../infrastructure/prisma/prisma-client.js';
import { JwtTokenService } from '../modules/auth/infrastructure/services/jwt-token.service.js';
import { User } from '../modules/users/domain/entities/user.entity.js';

interface ResourceResponse {
  id: string;
}

interface EvaluationQuestionResponse extends ResourceResponse {
  evaluationId: string;
}

interface EvaluationResponseBody extends ResourceResponse {
  passed: boolean | null;
}

interface CertificateResponse extends ResourceResponse {
  verificationCode: string;
}

interface SenceDeclarationResponse extends ResourceResponse {
  status: string;
}

const testOrganizationTaxId = 'E2E-COMMERCIAL-DEMO-001';
const bootstrapOrganizationId = '00000000-0000-4000-8000-000000000001';
const bootstrapActorUserId = '00000000-0000-4000-8000-000000000002';
const bootstrapOrganizationTaxId = 'E2E-COMMERCIAL-BOOTSTRAP-001';
const allDemoPermissions = [
  'organizations.read',
  'organizations.update',
  'users.read',
  'users.create',
  'users.update',
  'employees.read',
  'employees.create',
  'employees.update',
  'courses.read',
  'courses.create',
  'courses.update',
  'training_plan.read',
  'training_plan.create',
  'training_plan.update',
  'training_plan.approve',
  'training_sessions.read',
  'training_sessions.create',
  'training_sessions.update',
  'training_sessions.publish',
  'enrollments.read',
  'enrollments.create',
  'enrollments.update',
  'enrollments.confirm',
  'enrollments.complete',
  'attendance.read',
  'attendance.create',
  'attendance.update',
  'evaluations.read',
  'evaluations.create',
  'evaluations.update',
  'evaluations.submit',
  'evaluations.close',
  'evaluations.result',
  'certificates.read',
  'certificates.issue',
  'sence.read',
  'sence.create',
  'sence.validate',
  'sence.evidence',
  'sence.ready',
  'sence.submit',
];

function createBearerToken(organizationId: string, actorUserId = bootstrapActorUserId): string {
  const user = User.rehydrate({
    id: actorUserId,
    organizationId,
    firstName: 'Commercial',
    lastName: 'Demo',
    email: 'commercial-demo-admin@example.com',
    phone: null,
    passwordHash: 'hashed-password',
    roleIds: [],
    status: 'ACTIVE',
    lastLoginAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    deletedAt: null,
    version: 1,
  });

  const tokenPair = new JwtTokenService().createTokenPair(user, allDemoPermissions);
  return `Bearer ${tokenPair.accessToken}`;
}

async function cleanupCommercialDemoData(): Promise<void> {
  const organization = await prismaClient.organization.findUnique({
    where: { taxId: testOrganizationTaxId },
    select: { id: true },
  });

  if (!organization) {
    return;
  }

  const organizationId = organization.id;
  await prismaClient.auditEvent.deleteMany({ where: { organizationId } });
  await prismaClient.senceDocument.deleteMany({ where: { organizationId } });
  await prismaClient.senceDeclaration.deleteMany({ where: { organizationId } });
  await prismaClient.certificate.deleteMany({ where: { organizationId } });
  await prismaClient.evaluationAnswer.deleteMany({ where: { organizationId } });
  await prismaClient.evaluationResponse.deleteMany({ where: { organizationId } });
  await prismaClient.evaluationQuestion.deleteMany({ where: { organizationId } });
  await prismaClient.evaluation.deleteMany({ where: { organizationId } });
  await prismaClient.attendanceRecord.deleteMany({ where: { organizationId } });
  await prismaClient.enrollment.deleteMany({ where: { organizationId } });
  await prismaClient.trainingSession.deleteMany({ where: { organizationId } });
  await prismaClient.trainingPlanItem.deleteMany({ where: { organizationId } });
  await prismaClient.trainingPlan.deleteMany({ where: { organizationId } });
  await prismaClient.course.deleteMany({ where: { organizationId } });
  await prismaClient.employee.deleteMany({ where: { organizationId } });
  await prismaClient.userRole.deleteMany({ where: { organizationId } });
  await prismaClient.rolePermission.deleteMany({ where: { organizationId } });
  await prismaClient.role.deleteMany({ where: { organizationId } });
  await prismaClient.user.deleteMany({ where: { organizationId } });
  await prismaClient.organization.delete({ where: { id: organizationId } });
}

async function cleanupBootstrapActor(): Promise<void> {
  await prismaClient.auditEvent.deleteMany({ where: { actorUserId: bootstrapActorUserId } });
  await prismaClient.user.deleteMany({ where: { id: bootstrapActorUserId } });
  await prismaClient.organization.deleteMany({ where: { id: bootstrapOrganizationId } });
}

async function createBootstrapActor(): Promise<void> {
  await prismaClient.organization.create({
    data: {
      id: bootstrapOrganizationId,
      legalName: 'E2E Commercial Bootstrap',
      tradeName: 'E2E Commercial Bootstrap',
      taxId: bootstrapOrganizationTaxId,
      email: 'bootstrap@commercial-demo.example',
      type: 'INTERNAL',
      status: 'ACTIVE',
      country: 'CL',
    },
  });
  await prismaClient.user.create({
    data: {
      id: bootstrapActorUserId,
      organizationId: bootstrapOrganizationId,
      firstName: 'Commercial',
      lastName: 'Bootstrap',
      email: 'bootstrap.actor@commercial-demo.example',
      normalizedEmail: 'bootstrap.actor@commercial-demo.example',
      passwordHash: 'hashed-password',
      status: 'ACTIVE',
    },
  });
}

function assertSafeTestDatabase(): void {
  const databaseUrl = process.env['DATABASE_URL'] ?? '';
  const isExplicitTestUrl = Boolean(process.env['DATABASE_URL_TEST']);
  const isLocalDatabase =
    databaseUrl.includes('localhost') ||
    databaseUrl.includes('127.0.0.1') ||
    databaseUrl.includes('postgres:5432');

  if (!isExplicitTestUrl && !isLocalDatabase) {
    throw new Error('E2E tests require DATABASE_URL_TEST or a local PostgreSQL DATABASE_URL.');
  }
}

describe('commercial demo HTTP flow with real PostgreSQL', () => {
  const app = createApp();

  beforeAll(async () => {
    assertSafeTestDatabase();
    await cleanupCommercialDemoData();
    await cleanupBootstrapActor();
    await createBootstrapActor();
  });

  afterAll(async () => {
    await cleanupCommercialDemoData();
    await cleanupBootstrapActor();
    await prismaClient.$disconnect();
  });

  it('persists the commercial training lifecycle from organization through SENCE declaration', async () => {
    const organizationResponse = await request(app)
      .post('/api/v1/organizations')
      .set('Authorization', createBearerToken(bootstrapOrganizationId))
      .send({
        name: 'E2E Commercial Demo',
        legalName: 'E2E Commercial Demo SpA',
        taxId: testOrganizationTaxId,
        type: 'CLIENT_COMPANY',
        email: 'admin@commercial-demo.example',
        industry: 'Mining',
      })
      .expect(201);
    const organization = organizationResponse.body as ResourceResponse;
    const authorization = createBearerToken(organization.id);

    const userResponse = await request(app)
      .post('/api/v1/users')
      .set('Authorization', authorization)
      .send({
        organizationId: organization.id,
        email: 'hr.lead@commercial-demo.example',
        firstName: 'HR',
        lastName: 'Lead',
        roleIds: [],
        password: 'StrongPass123',
      })
      .expect(201);
    const user = userResponse.body as ResourceResponse;

    const employeeResponse = await request(app)
      .post('/api/v1/employees')
      .set('Authorization', authorization)
      .send({
        organizationId: organization.id,
        documentNumber: '18.111.222-3',
        firstName: 'Demo',
        lastName: 'Participant',
        email: 'participant@commercial-demo.example',
        positionName: 'Operations Analyst',
        areaName: 'Operations',
      })
      .expect(201);
    const employee = employeeResponse.body as ResourceResponse;

    const courseResponse = await request(app)
      .post('/api/v1/courses')
      .set('Authorization', authorization)
      .send({
        organizationId: organization.id,
        code: 'SAFE-101-E2E',
        name: 'Operational Safety Essentials',
        description: 'Commercial demo course for compliance training.',
        modality: 'PRESENTIAL',
        durationHours: 8,
      })
      .expect(201);
    const course = courseResponse.body as ResourceResponse;

    await request(app)
      .patch(`/api/v1/courses/${course.id}`)
      .set('Authorization', authorization)
      .send({ status: 'ACTIVE' })
      .expect(200);

    const trainingPlanResponse = await request(app)
      .post('/api/v1/training-plans')
      .set('Authorization', authorization)
      .send({
        organizationId: organization.id,
        name: 'E2E Annual Training Plan',
        year: 2026,
        budgetAmount: 2500000,
        currency: 'CLP',
      })
      .expect(201);
    const trainingPlan = trainingPlanResponse.body as ResourceResponse;

    const trainingPlanItemResponse = await request(app)
      .post(`/api/v1/training-plans/${trainingPlan.id}/items`)
      .set('Authorization', authorization)
      .send({
        courseId: course.id,
        plannedMonth: 7,
        quarter: 3,
        estimatedParticipants: 20,
        estimatedCost: 1200000,
        priority: 'HIGH',
        businessJustification: 'Mandatory commercial demo compliance path.',
      })
      .expect(201);
    const trainingPlanItem = trainingPlanItemResponse.body as ResourceResponse;

    const sessionStart = '2026-07-15T13:00:00.000Z';
    const sessionEnd = '2026-07-15T21:00:00.000Z';
    const trainingSessionResponse = await request(app)
      .post('/api/v1/training-sessions')
      .set('Authorization', authorization)
      .send({
        organizationId: organization.id,
        courseId: course.id,
        trainingPlanItemId: trainingPlanItem.id,
        name: 'Operational Safety Essentials - July',
        startDate: sessionStart,
        endDate: sessionEnd,
        location: 'Santiago Training Room A',
        capacity: 24,
        costAmount: 1200000,
      })
      .expect(201);
    const trainingSession = trainingSessionResponse.body as ResourceResponse;

    await request(app)
      .post(`/api/v1/training-sessions/${trainingSession.id}/publish`)
      .set('Authorization', authorization)
      .expect(200);

    const enrollmentResponse = await request(app)
      .post('/api/v1/enrollments')
      .set('Authorization', authorization)
      .send({
        organizationId: organization.id,
        trainingSessionId: trainingSession.id,
        employeeId: employee.id,
      })
      .expect(201);
    const enrollment = enrollmentResponse.body as ResourceResponse;

    await request(app)
      .post(`/api/v1/enrollments/${enrollment.id}/confirm`)
      .set('Authorization', authorization)
      .expect(200);

    const attendanceResponse = await request(app)
      .post('/api/v1/attendance')
      .set('Authorization', authorization)
      .send({
        organizationId: organization.id,
        enrollmentId: enrollment.id,
        trainingSessionId: trainingSession.id,
        employeeId: employee.id,
        method: 'MANUAL',
        status: 'PRESENT',
        checkInAt: sessionStart,
        checkOutAt: sessionEnd,
      })
      .expect(201);
    const attendance = attendanceResponse.body as ResourceResponse;

    const evaluationResponse = await request(app)
      .post('/api/v1/evaluations')
      .set('Authorization', authorization)
      .send({
        organizationId: organization.id,
        trainingSessionId: trainingSession.id,
        type: 'KNOWLEDGE_TEST',
        title: 'Operational Safety Final Test',
        passingScore: 70,
      })
      .expect(201);
    const evaluation = evaluationResponse.body as ResourceResponse;

    const questionResponse = await request(app)
      .post(`/api/v1/evaluations/${evaluation.id}/questions`)
      .set('Authorization', authorization)
      .send({
        type: 'SINGLE_CHOICE',
        questionText: 'What is the safest default action before operating equipment?',
        options: ['Start immediately', 'Verify controls', 'Skip inspection'],
        correctAnswer: 'Verify controls',
        points: 100,
        orderIndex: 0,
        required: true,
      })
      .expect(201);
    const question = questionResponse.body as EvaluationQuestionResponse;

    const submittedEvaluationResponse = await request(app)
      .post(`/api/v1/evaluations/${evaluation.id}/submit`)
      .set('Authorization', authorization)
      .send({
        organizationId: organization.id,
        enrollmentId: enrollment.id,
        employeeId: employee.id,
        answers: [
          {
            evaluationQuestionId: question.id,
            answer: 'Verify controls',
          },
        ],
      })
      .expect(201);
    const submittedEvaluation = submittedEvaluationResponse.body as EvaluationResponseBody;

    await request(app)
      .post(`/api/v1/evaluations/${evaluation.id}/close`)
      .set('Authorization', authorization)
      .expect(200);

    await request(app)
      .post(`/api/v1/enrollments/${enrollment.id}/complete`)
      .set('Authorization', authorization)
      .expect(200);

    const certificateResponse = await request(app)
      .post('/api/v1/certificates')
      .set('Authorization', authorization)
      .send({ enrollmentId: enrollment.id })
      .expect(201);
    const certificate = certificateResponse.body as CertificateResponse;

    const senceDeclarationResponse = await request(app)
      .post('/api/v1/sence/declarations')
      .set('Authorization', authorization)
      .send({
        trainingSessionId: trainingSession.id,
        senceCode: 'SENCE-E2E-001',
        declaredAmount: 1200000,
        taxCreditAmount: 600000,
        externalCode: 'EXT-E2E-001',
      })
      .expect(201);
    const senceDeclaration = senceDeclarationResponse.body as SenceDeclarationResponse;

    await request(app)
      .post(`/api/v1/sence/declarations/${senceDeclaration.id}/validate`)
      .set('Authorization', authorization)
      .expect(200);
    await request(app)
      .post(`/api/v1/sence/declarations/${senceDeclaration.id}/evidence`)
      .set('Authorization', authorization)
      .expect(200);

    await expect(prismaClient.organization.findUnique({ where: { id: organization.id } })).resolves.toMatchObject({
      id: organization.id,
      taxId: testOrganizationTaxId,
    });
    await expect(prismaClient.user.findUnique({ where: { id: user.id } })).resolves.toMatchObject({
      id: user.id,
      organizationId: organization.id,
    });
    await expect(prismaClient.employee.findUnique({ where: { id: employee.id } })).resolves.toMatchObject({
      id: employee.id,
      organizationId: organization.id,
    });
    await expect(prismaClient.attendanceRecord.findUnique({ where: { id: attendance.id } })).resolves.toMatchObject({
      id: attendance.id,
      enrollmentId: enrollment.id,
      status: 'PRESENT',
    });
    await expect(
      prismaClient.evaluationResponse.findUnique({ where: { id: submittedEvaluation.id } }),
    ).resolves.toMatchObject({
      id: submittedEvaluation.id,
      passed: true,
    });
    await expect(prismaClient.certificate.findUnique({ where: { id: certificate.id } })).resolves.toMatchObject({
      id: certificate.id,
      enrollmentId: enrollment.id,
      verificationCode: certificate.verificationCode,
    });
    await expect(prismaClient.senceDeclaration.findUnique({ where: { id: senceDeclaration.id } })).resolves.toMatchObject({
      id: senceDeclaration.id,
      trainingSessionId: trainingSession.id,
      status: 'DRAFT',
    });
    expect(submittedEvaluation.passed).toBe(true);
    expect(question.evaluationId).toBe(evaluation.id);
  });
});
