import type { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

import { prismaClient } from '../../../infrastructure/prisma/prisma-client.js';
import type { AuditLogger } from '../../../shared/application/audit-logger.js';
import { PrismaAuditLogger } from '../../../shared/infrastructure/prisma/prisma-audit-logger.js';

const demoOrganization = {
  taxId: '76.555.444-0',
  legalName: 'SkillFlow Demo Mining SpA',
  tradeName: 'SkillFlow Demo',
  email: 'admin@skillflow.demo',
};

const demoPermissionCodes = [
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
  'enrollments.reject',
  'enrollments.cancel',
  'enrollments.complete',
  'attendance.read',
  'attendance.create',
  'attendance.bulk',
  'attendance.update',
  'attendance.checkin',
  'attendance.checkout',
  'attendance.metrics',
  'evaluations.read',
  'evaluations.create',
  'evaluations.update',
  'evaluations.submit',
  'evaluations.close',
  'evaluations.result',
  'certificates.read',
  'certificates.issue',
  'certificates.revoke',
  'certificates.document',
  'sence.read',
  'sence.create',
  'sence.update',
  'sence.validate',
  'sence.evidence',
  'sence.ready',
  'sence.submit',
  'sence.status',
  'sence.documents',
] as const;

export interface DemoBootstrapSummary {
  organizationId: string;
  adminUserId: string;
  adminRoleId: string;
  permissionCount: number;
  employeeId: string;
  courseId: string;
  trainingPlanId: string;
  trainingSessionId: string;
  enrollmentId: string;
  attendanceRecordId: string;
  evaluationId: string;
  evaluationQuestionId: string;
  evaluationResponseId: string;
  evaluationAnswerId: string;
  certificateId: string;
  senceDeclarationId: string;
  organizationAlreadyExisted: boolean;
}

interface BootstrapDemoDataInput {
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function bootstrapDemoData(
  input: BootstrapDemoDataInput = {},
  prisma: PrismaClient = prismaClient,
  auditLogger: AuditLogger = new PrismaAuditLogger(prisma),
): Promise<DemoBootstrapSummary> {
  const existingOrganization = await prisma.organization.findUnique({
    where: { taxId: demoOrganization.taxId },
    select: { id: true },
  });
  const organizationAlreadyExisted = Boolean(existingOrganization);
  const passwordHash = await bcrypt.hash('DemoPassword123', 10);

  const organization = await prisma.organization.upsert({
    where: { taxId: demoOrganization.taxId },
    update: {
      legalName: demoOrganization.legalName,
      tradeName: demoOrganization.tradeName,
      email: demoOrganization.email,
      type: 'CLIENT_COMPANY',
      status: 'ACTIVE',
      industry: 'Mining',
      country: 'CL',
    },
    create: {
      legalName: demoOrganization.legalName,
      tradeName: demoOrganization.tradeName,
      taxId: demoOrganization.taxId,
      email: demoOrganization.email,
      type: 'CLIENT_COMPANY',
      status: 'ACTIVE',
      industry: 'Mining',
      country: 'CL',
    },
  });

  const adminUser = await prisma.user.upsert({
    where: {
      organizationId_normalizedEmail: {
        organizationId: organization.id,
        normalizedEmail: 'admin@skillflow.demo',
      },
    },
    update: {
      firstName: 'Demo',
      lastName: 'Admin',
      email: 'admin@skillflow.demo',
      passwordHash,
      status: 'ACTIVE',
    },
    create: {
      organizationId: organization.id,
      firstName: 'Demo',
      lastName: 'Admin',
      email: 'admin@skillflow.demo',
      normalizedEmail: 'admin@skillflow.demo',
      passwordHash,
      status: 'ACTIVE',
    },
  });

  const adminRole = await prisma.role.upsert({
    where: {
      organizationId_code: {
        organizationId: organization.id,
        code: 'demo-admin',
      },
    },
    update: {
      name: 'Demo Administrator',
      description: 'Administrative demo role for the public SkillFlow walkthrough.',
      isSystem: true,
    },
    create: {
      organizationId: organization.id,
      code: 'demo-admin',
      name: 'Demo Administrator',
      description: 'Administrative demo role for the public SkillFlow walkthrough.',
      isSystem: true,
    },
  });

  const permissions = await Promise.all(
    demoPermissionCodes.map((code) =>
      prisma.permission.upsert({
        where: { code },
        update: {
          name: toPermissionName(code),
          description: `Allows ${code}.`,
        },
        create: {
          code,
          name: toPermissionName(code),
          description: `Allows ${code}.`,
        },
      }),
    ),
  );

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: { organizationId: organization.id },
    create: {
      organizationId: organization.id,
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });

  await Promise.all(
    permissions.map((permission) =>
      prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: adminRole.id,
            permissionId: permission.id,
          },
        },
        update: { organizationId: organization.id },
        create: {
          organizationId: organization.id,
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      }),
    ),
  );

  const employee = await prisma.employee.upsert({
    where: {
      organizationId_rut: {
        organizationId: organization.id,
        rut: '18.222.333-4',
      },
    },
    update: {
      firstName: 'Camila',
      lastName: 'Torres',
      email: 'camila.torres@skillflow-demo.example',
      normalizedEmail: 'camila.torres@skillflow-demo.example',
      areaName: 'Operations',
      positionName: 'Shift Supervisor',
      status: 'ACTIVE',
    },
    create: {
      organizationId: organization.id,
      rut: '18.222.333-4',
      employeeCode: 'EMP-DEMO-001',
      firstName: 'Camila',
      lastName: 'Torres',
      email: 'camila.torres@skillflow-demo.example',
      normalizedEmail: 'camila.torres@skillflow-demo.example',
      areaName: 'Operations',
      positionName: 'Shift Supervisor',
      status: 'ACTIVE',
    },
  });

  const course = await prisma.course.upsert({
    where: {
      organizationId_code: {
        organizationId: organization.id,
        code: 'SFC-DEMO-001',
      },
    },
    update: {
      name: 'Operational Safety Essentials',
      description: 'Demo course for commercial training and compliance walkthroughs.',
      modality: 'PRESENTIAL',
      durationHours: 8,
      senceCode: 'SENCE-DEMO-001',
      status: 'ACTIVE',
    },
    create: {
      organizationId: organization.id,
      code: 'SFC-DEMO-001',
      name: 'Operational Safety Essentials',
      description: 'Demo course for commercial training and compliance walkthroughs.',
      modality: 'PRESENTIAL',
      durationHours: 8,
      senceCode: 'SENCE-DEMO-001',
      status: 'ACTIVE',
    },
  });

  const trainingPlan = await prisma.trainingPlan.upsert({
    where: {
      organizationId_year: {
        organizationId: organization.id,
        year: 2026,
      },
    },
    update: {
      name: 'Demo Annual Training Plan 2026',
      budgetAmount: 2500000,
      currency: 'CLP',
      status: 'APPROVED',
      approvedAt: new Date('2026-01-15T12:00:00.000Z'),
    },
    create: {
      organizationId: organization.id,
      name: 'Demo Annual Training Plan 2026',
      year: 2026,
      budgetAmount: 2500000,
      currency: 'CLP',
      status: 'APPROVED',
      approvedAt: new Date('2026-01-15T12:00:00.000Z'),
    },
  });

  const trainingPlanItem = await prisma.trainingPlanItem.upsert({
    where: {
      trainingPlanId_courseId: {
        trainingPlanId: trainingPlan.id,
        courseId: course.id,
      },
    },
    update: {
      plannedMonth: 7,
      quarter: 3,
      estimatedParticipants: 24,
      estimatedCost: 1200000,
      priority: 'HIGH',
      businessJustification: 'Commercial demo compliance training path.',
    },
    create: {
      organizationId: organization.id,
      trainingPlanId: trainingPlan.id,
      courseId: course.id,
      plannedMonth: 7,
      quarter: 3,
      estimatedParticipants: 24,
      estimatedCost: 1200000,
      priority: 'HIGH',
      businessJustification: 'Commercial demo compliance training path.',
    },
  });

  const trainingSession = await upsertDemoTrainingSession(prisma, {
    organizationId: organization.id,
    courseId: course.id,
    trainingPlanItemId: trainingPlanItem.id,
  });
  const enrollment = await prisma.enrollment.upsert({
    where: {
      trainingSessionId_employeeId: {
        trainingSessionId: trainingSession.id,
        employeeId: employee.id,
      },
    },
    update: {
      organizationId: organization.id,
      status: 'COMPLETED',
      completionPercentage: 100,
      finalScore: 100,
      approved: true,
    },
    create: {
      organizationId: organization.id,
      trainingSessionId: trainingSession.id,
      employeeId: employee.id,
      status: 'COMPLETED',
      completionPercentage: 100,
      finalScore: 100,
      approved: true,
    },
  });

  const attendanceRecord = await upsertDemoAttendance(prisma, {
    organizationId: organization.id,
    trainingSessionId: trainingSession.id,
    employeeId: employee.id,
    enrollmentId: enrollment.id,
  });
  const evaluation = await upsertDemoEvaluation(prisma, organization.id, trainingSession.id);
  const evaluationQuestion = await prisma.evaluationQuestion.upsert({
    where: {
      evaluationId_orderIndex: {
        evaluationId: evaluation.id,
        orderIndex: 0,
      },
    },
    update: {
      organizationId: organization.id,
      type: 'SINGLE_CHOICE',
      questionText: 'What is the safest default action before operating equipment?',
      options: ['Start immediately', 'Verify controls', 'Skip inspection'],
      correctAnswer: 'Verify controls',
      points: 100,
      required: true,
    },
    create: {
      organizationId: organization.id,
      evaluationId: evaluation.id,
      type: 'SINGLE_CHOICE',
      questionText: 'What is the safest default action before operating equipment?',
      options: ['Start immediately', 'Verify controls', 'Skip inspection'],
      correctAnswer: 'Verify controls',
      points: 100,
      orderIndex: 0,
      required: true,
    },
  });
  const evaluationResponse = await prisma.evaluationResponse.upsert({
    where: {
      evaluationId_employeeId: {
        evaluationId: evaluation.id,
        employeeId: employee.id,
      },
    },
    update: {
      organizationId: organization.id,
      enrollmentId: enrollment.id,
      score: 100,
      passed: true,
      answersPayload: [{ evaluationQuestionId: evaluationQuestion.id, answer: 'Verify controls' }],
    },
    create: {
      organizationId: organization.id,
      evaluationId: evaluation.id,
      enrollmentId: enrollment.id,
      employeeId: employee.id,
      score: 100,
      passed: true,
      answersPayload: [{ evaluationQuestionId: evaluationQuestion.id, answer: 'Verify controls' }],
    },
  });
  const evaluationAnswer = await prisma.evaluationAnswer.upsert({
    where: {
      evaluationResponseId_evaluationQuestionId: {
        evaluationResponseId: evaluationResponse.id,
        evaluationQuestionId: evaluationQuestion.id,
      },
    },
    update: {
      organizationId: organization.id,
      employeeId: employee.id,
      answer: 'Verify controls',
      score: 100,
    },
    create: {
      organizationId: organization.id,
      evaluationResponseId: evaluationResponse.id,
      evaluationQuestionId: evaluationQuestion.id,
      employeeId: employee.id,
      answer: 'Verify controls',
      score: 100,
    },
  });
  const certificate = await prisma.certificate.upsert({
    where: { certificateNumber: 'DEMO-SKILLFLOW-001' },
    update: {
      organizationId: organization.id,
      enrollmentId: enrollment.id,
      employeeId: employee.id,
      courseId: course.id,
      trainingSessionId: trainingSession.id,
      status: 'ISSUED',
    },
    create: {
      organizationId: organization.id,
      enrollmentId: enrollment.id,
      employeeId: employee.id,
      courseId: course.id,
      trainingSessionId: trainingSession.id,
      certificateNumber: 'DEMO-SKILLFLOW-001',
      verificationCode: 'DEMO-VERIFY-SKILLFLOW-001',
      status: 'ISSUED',
    },
  });
  const senceDeclaration = await prisma.senceDeclaration.upsert({
    where: {
      organizationId_trainingSessionId: {
        organizationId: organization.id,
        trainingSessionId: trainingSession.id,
      },
    },
    update: {
      senceCode: 'SENCE-DEMO-001',
      declaredAmount: 1200000,
      taxCreditAmount: 600000,
      externalCode: 'EXT-DEMO-001',
      status: 'READY',
    },
    create: {
      organizationId: organization.id,
      trainingSessionId: trainingSession.id,
      senceCode: 'SENCE-DEMO-001',
      declaredAmount: 1200000,
      taxCreditAmount: 600000,
      externalCode: 'EXT-DEMO-001',
      status: 'READY',
    },
  });

  const summary: DemoBootstrapSummary = {
    organizationId: organization.id,
    adminUserId: adminUser.id,
    adminRoleId: adminRole.id,
    permissionCount: permissions.length,
    employeeId: employee.id,
    courseId: course.id,
    trainingPlanId: trainingPlan.id,
    trainingSessionId: trainingSession.id,
    enrollmentId: enrollment.id,
    attendanceRecordId: attendanceRecord.id,
    evaluationId: evaluation.id,
    evaluationQuestionId: evaluationQuestion.id,
    evaluationResponseId: evaluationResponse.id,
    evaluationAnswerId: evaluationAnswer.id,
    certificateId: certificate.id,
    senceDeclarationId: senceDeclaration.id,
    organizationAlreadyExisted,
  };

  await auditLogger.record({
    organizationId: organization.id,
    actorUserId: adminUser.id,
    entityType: 'SYSTEM',
    entityId: organization.id,
    action: 'SYSTEM_DEMO_BOOTSTRAPPED',
    metadata: { ...summary },
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
  });

  return summary;
}

async function upsertDemoTrainingSession(
  prisma: PrismaClient,
  input: { organizationId: string; courseId: string; trainingPlanItemId: string },
) {
  const existing = await prisma.trainingSession.findFirst({
    where: {
      organizationId: input.organizationId,
      name: 'Demo Safety Session',
    },
  });
  const data = {
    organizationId: input.organizationId,
    courseId: input.courseId,
    trainingPlanItemId: input.trainingPlanItemId,
    name: 'Demo Safety Session',
    startDate: new Date('2026-07-15T13:00:00.000Z'),
    endDate: new Date('2026-07-15T21:00:00.000Z'),
    location: 'Santiago Training Room A',
    capacity: 24,
    costAmount: 1200000,
    status: 'PUBLISHED' as const,
  };

  if (existing) {
    return prisma.trainingSession.update({ where: { id: existing.id }, data });
  }

  return prisma.trainingSession.create({ data });
}

async function upsertDemoAttendance(
  prisma: PrismaClient,
  input: { organizationId: string; enrollmentId: string; trainingSessionId: string; employeeId: string },
) {
  const data = {
    organizationId: input.organizationId,
    enrollmentId: input.enrollmentId,
    trainingSessionId: input.trainingSessionId,
    employeeId: input.employeeId,
    method: 'MANUAL' as const,
    status: 'PRESENT' as const,
    checkInAt: new Date('2026-07-15T13:00:00.000Z'),
    checkOutAt: new Date('2026-07-15T21:00:00.000Z'),
  };
  const existing = await prisma.attendanceRecord.findFirst({
    where: {
      enrollmentId: input.enrollmentId,
      trainingSessionId: input.trainingSessionId,
      employeeId: input.employeeId,
    },
  });

  if (existing) {
    return prisma.attendanceRecord.update({ where: { id: existing.id }, data });
  }

  return prisma.attendanceRecord.create({ data });
}

async function upsertDemoEvaluation(
  prisma: PrismaClient,
  organizationId: string,
  trainingSessionId: string,
) {
  const data = {
    organizationId,
    trainingSessionId,
    type: 'KNOWLEDGE_TEST' as const,
    title: 'Operational Safety Final Test',
    passingScore: 70,
    closedAt: new Date('2026-07-15T22:00:00.000Z'),
  };
  const existing = await prisma.evaluation.findFirst({
    where: {
      organizationId,
      trainingSessionId,
      title: data.title,
    },
  });

  if (existing) {
    return prisma.evaluation.update({ where: { id: existing.id }, data });
  }

  return prisma.evaluation.create({ data });
}

function toPermissionName(code: string): string {
  return code
    .split(/[._]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
