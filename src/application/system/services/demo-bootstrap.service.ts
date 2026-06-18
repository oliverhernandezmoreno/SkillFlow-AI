import type { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

import { prismaClient } from '../../../infrastructure/prisma/prisma-client.js';
import type { AuditLogger } from '../../../shared/application/audit-logger.js';
import { PrismaAuditLogger } from '../../../shared/infrastructure/prisma/prisma-audit-logger.js';

const demoOrganization = {
  taxId: '76.555.444-0',
  legalName: 'Minera Andes Capacitación SpA',
  tradeName: 'Minera Andes Capacitación',
  email: 'admin@skillflow.demo',
};

const demoEmployees = [
  {
    rut: '18.222.333-4',
    employeeCode: 'EMP-DEMO-001',
    firstName: 'María',
    lastName: 'González',
    email: 'maria.gonzalez@mineraandes.demo',
    areaName: 'Operaciones Mina',
    positionName: 'Supervisora de Turno',
  },
  {
    rut: '16.444.555-6',
    employeeCode: 'EMP-DEMO-002',
    firstName: 'Carlos',
    lastName: 'Rojas',
    email: 'carlos.rojas@mineraandes.demo',
    areaName: 'Mantención',
    positionName: 'Técnico Mecánico',
  },
  {
    rut: '19.777.888-9',
    employeeCode: 'EMP-DEMO-003',
    firstName: 'Fernanda',
    lastName: 'Muñoz',
    email: 'fernanda.munoz@mineraandes.demo',
    areaName: 'Recursos Humanos',
    positionName: 'Analista de Capacitación',
  },
  {
    rut: '15.111.222-3',
    employeeCode: 'EMP-DEMO-004',
    firstName: 'Rodrigo',
    lastName: 'Pérez',
    email: 'rodrigo.perez@mineraandes.demo',
    areaName: 'Seguridad y Salud Ocupacional',
    positionName: 'Prevencionista de Riesgos',
  },
] as const;

const demoCourses = [
  {
    code: 'SFC-DEMO-001',
    name: 'Seguridad Operacional',
    description: 'Curso demo para gestión de seguridad operacional y cumplimiento interno.',
    modality: 'PRESENTIAL' as const,
    durationHours: 8,
    senceCode: 'SENCE-DEMO-001',
  },
  {
    code: 'SFC-DEMO-002',
    name: 'Trabajo en Altura',
    description: 'Capacitación práctica para trabajos críticos y control de riesgos.',
    modality: 'PRESENTIAL' as const,
    durationHours: 6,
    senceCode: 'SENCE-DEMO-002',
  },
  {
    code: 'SFC-DEMO-003',
    name: 'Inducción Corporativa',
    description: 'Inducción para nuevos colaboradores y estándares corporativos.',
    modality: 'HYBRID' as const,
    durationHours: 4,
    senceCode: 'SENCE-DEMO-003',
  },
  {
    code: 'SFC-DEMO-004',
    name: 'Ciberseguridad para Colaboradores',
    description: 'Buenas prácticas digitales para proteger información corporativa.',
    modality: 'ONLINE' as const,
    durationHours: 3,
    senceCode: 'SENCE-DEMO-004',
  },
] as const;

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
      industry: 'Minería',
      country: 'CL',
    },
    create: {
      legalName: demoOrganization.legalName,
      tradeName: demoOrganization.tradeName,
      taxId: demoOrganization.taxId,
      email: demoOrganization.email,
      type: 'CLIENT_COMPANY',
      status: 'ACTIVE',
      industry: 'Minería',
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
      name: 'Administrador RRHH',
      description: 'Rol administrativo demo para presentar SkillFlow AI.',
      isSystem: true,
    },
    create: {
      organizationId: organization.id,
      code: 'demo-admin',
      name: 'Administrador RRHH',
      description: 'Rol administrativo demo para presentar SkillFlow AI.',
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

  const employees = await Promise.all(
    demoEmployees.map((demoEmployee) =>
      prisma.employee.upsert({
        where: {
          organizationId_rut: {
            organizationId: organization.id,
            rut: demoEmployee.rut,
          },
        },
        update: {
          firstName: demoEmployee.firstName,
          lastName: demoEmployee.lastName,
          email: demoEmployee.email,
          normalizedEmail: demoEmployee.email,
          areaName: demoEmployee.areaName,
          positionName: demoEmployee.positionName,
          status: 'ACTIVE',
        },
        create: {
          organizationId: organization.id,
          rut: demoEmployee.rut,
          employeeCode: demoEmployee.employeeCode,
          firstName: demoEmployee.firstName,
          lastName: demoEmployee.lastName,
          email: demoEmployee.email,
          normalizedEmail: demoEmployee.email,
          areaName: demoEmployee.areaName,
          positionName: demoEmployee.positionName,
          status: 'ACTIVE',
        },
      }),
    ),
  );
  const [employee] = employees;
  if (!employee) {
    throw new Error('Demo employee seed is empty.');
  }

  const courses = await Promise.all(
    demoCourses.map((demoCourse) =>
      prisma.course.upsert({
        where: {
          organizationId_code: {
            organizationId: organization.id,
            code: demoCourse.code,
          },
        },
        update: {
          name: demoCourse.name,
          description: demoCourse.description,
          modality: demoCourse.modality,
          durationHours: demoCourse.durationHours,
          senceCode: demoCourse.senceCode,
          status: 'ACTIVE',
        },
        create: {
          organizationId: organization.id,
          code: demoCourse.code,
          name: demoCourse.name,
          description: demoCourse.description,
          modality: demoCourse.modality,
          durationHours: demoCourse.durationHours,
          senceCode: demoCourse.senceCode,
          status: 'ACTIVE',
        },
      }),
    ),
  );
  const [course] = courses;
  if (!course) {
    throw new Error('Demo course seed is empty.');
  }

  const trainingPlan = await prisma.trainingPlan.upsert({
    where: {
      organizationId_year: {
        organizationId: organization.id,
        year: 2026,
      },
    },
    update: {
      name: 'Plan Anual de Capacitación 2026',
      budgetAmount: 2500000,
      currency: 'CLP',
      status: 'APPROVED',
      approvedAt: new Date('2026-01-15T12:00:00.000Z'),
    },
    create: {
      organizationId: organization.id,
      name: 'Plan Anual de Capacitación 2026',
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
      businessJustification: 'Ruta demo de cumplimiento y seguridad operacional.',
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
      businessJustification: 'Ruta demo de cumplimiento y seguridad operacional.',
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
      questionText: '¿Cuál es la acción segura antes de operar un equipo?',
      options: ['Iniciar inmediatamente', 'Verificar controles', 'Omitir inspección'],
      correctAnswer: 'Verificar controles',
      points: 100,
      required: true,
    },
    create: {
      organizationId: organization.id,
      evaluationId: evaluation.id,
      type: 'SINGLE_CHOICE',
      questionText: '¿Cuál es la acción segura antes de operar un equipo?',
      options: ['Iniciar inmediatamente', 'Verificar controles', 'Omitir inspección'],
      correctAnswer: 'Verificar controles',
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
      answersPayload: [{ evaluationQuestionId: evaluationQuestion.id, answer: 'Verificar controles' }],
    },
    create: {
      organizationId: organization.id,
      evaluationId: evaluation.id,
      enrollmentId: enrollment.id,
      employeeId: employee.id,
      score: 100,
      passed: true,
      answersPayload: [{ evaluationQuestionId: evaluationQuestion.id, answer: 'Verificar controles' }],
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
      answer: 'Verificar controles',
      score: 100,
    },
    create: {
      organizationId: organization.id,
      evaluationResponseId: evaluationResponse.id,
      evaluationQuestionId: evaluationQuestion.id,
      employeeId: employee.id,
      answer: 'Verificar controles',
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
      name: 'Seguridad Operacional - Junio 2026',
    },
  });
  const data = {
    organizationId: input.organizationId,
    courseId: input.courseId,
    trainingPlanItemId: input.trainingPlanItemId,
    name: 'Seguridad Operacional - Junio 2026',
    startDate: new Date('2026-06-24T13:00:00.000Z'),
    endDate: new Date('2026-06-24T21:00:00.000Z'),
    location: 'Sala de Capacitación Santiago',
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
    checkInAt: new Date('2026-06-24T13:00:00.000Z'),
    checkOutAt: new Date('2026-06-24T21:00:00.000Z'),
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
    title: 'Evaluación Final Seguridad Operacional',
    passingScore: 70,
    closedAt: new Date('2026-06-24T22:00:00.000Z'),
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
