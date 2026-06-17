import { randomUUID } from 'node:crypto';

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const demoOrganization = {
  taxId: '76.555.444-0',
  legalName: 'SkillFlow Demo Mining SpA',
  tradeName: 'SkillFlow Demo',
  email: 'admin@skillflow.demo',
};

async function main(): Promise<void> {
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

  const trainingSession = await prisma.trainingSession.create({
    data: {
      organizationId: organization.id,
      courseId: course.id,
      trainingPlanItemId: trainingPlanItem.id,
      name: `Demo Safety Session ${new Date().toISOString()}`,
      startDate: new Date('2026-07-15T13:00:00.000Z'),
      endDate: new Date('2026-07-15T21:00:00.000Z'),
      location: 'Santiago Training Room A',
      capacity: 24,
      costAmount: 1200000,
      status: 'PUBLISHED',
    },
  });

  const enrollment = await prisma.enrollment.create({
    data: {
      organizationId: organization.id,
      trainingSessionId: trainingSession.id,
      employeeId: employee.id,
      status: 'COMPLETED',
      completionPercentage: 100,
      finalScore: 100,
      approved: true,
    },
  });

  await prisma.attendanceRecord.create({
    data: {
      organizationId: organization.id,
      enrollmentId: enrollment.id,
      trainingSessionId: trainingSession.id,
      employeeId: employee.id,
      method: 'MANUAL',
      status: 'PRESENT',
      checkInAt: new Date('2026-07-15T13:00:00.000Z'),
      checkOutAt: new Date('2026-07-15T21:00:00.000Z'),
    },
  });

  const evaluation = await prisma.evaluation.create({
    data: {
      organizationId: organization.id,
      trainingSessionId: trainingSession.id,
      type: 'KNOWLEDGE_TEST',
      title: 'Operational Safety Final Test',
      passingScore: 70,
      closedAt: new Date('2026-07-15T22:00:00.000Z'),
    },
  });

  const question = await prisma.evaluationQuestion.create({
    data: {
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

  const evaluationResponse = await prisma.evaluationResponse.create({
    data: {
      organizationId: organization.id,
      evaluationId: evaluation.id,
      enrollmentId: enrollment.id,
      employeeId: employee.id,
      score: 100,
      passed: true,
      answersPayload: [{ evaluationQuestionId: question.id, answer: 'Verify controls' }],
    },
  });

  await prisma.evaluationAnswer.create({
    data: {
      organizationId: organization.id,
      evaluationResponseId: evaluationResponse.id,
      evaluationQuestionId: question.id,
      employeeId: employee.id,
      answer: 'Verify controls',
      score: 100,
    },
  });

  const certificate = await prisma.certificate.create({
    data: {
      organizationId: organization.id,
      enrollmentId: enrollment.id,
      employeeId: employee.id,
      courseId: course.id,
      trainingSessionId: trainingSession.id,
      certificateNumber: `DEMO-${Date.now()}`,
      verificationCode: randomUUID(),
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

  console.log(
    JSON.stringify(
      {
        organizationId: organization.id,
        adminUserId: adminUser.id,
        employeeId: employee.id,
        courseId: course.id,
        trainingPlanId: trainingPlan.id,
        trainingSessionId: trainingSession.id,
        enrollmentId: enrollment.id,
        certificateId: certificate.id,
        senceDeclarationId: senceDeclaration.id,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
