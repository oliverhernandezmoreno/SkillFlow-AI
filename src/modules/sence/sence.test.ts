import { describe, expect, it } from 'vitest';

import type { PaginatedResult, PaginationInput } from '../../shared/application/pagination.js';
import { BadRequestError, NotFoundError } from '../../shared/domain/errors.js';
import { AttachSenceDocumentUseCase } from './application/use-cases/attach-sence-document.use-case.js';
import { BuildSenceEvidenceUseCase } from './application/use-cases/build-sence-evidence.use-case.js';
import { CreateSenceDeclarationUseCase } from './application/use-cases/create-sence-declaration.use-case.js';
import { GetSenceDeclarationByTrainingSessionUseCase } from './application/use-cases/get-sence-declaration-by-training-session.use-case.js';
import { ListSenceDocumentsUseCase } from './application/use-cases/list-sence-documents.use-case.js';
import { MarkSenceDeclarationReadyUseCase } from './application/use-cases/mark-sence-declaration-ready.use-case.js';
import { SubmitSenceDeclarationUseCase } from './application/use-cases/submit-sence-declaration.use-case.js';
import { UpdateSenceDeclarationStatusUseCase } from './application/use-cases/update-sence-declaration-status.use-case.js';
import { ValidateSenceComplianceUseCase } from './application/use-cases/validate-sence-compliance.use-case.js';
import { SenceDeclaration } from './domain/entities/sence-declaration.entity.js';
import { SenceDocument } from './domain/entities/sence-document.entity.js';
import type {
  SenceComplianceSnapshot,
  SenceRepository,
  SenceSearchFilters,
} from './domain/repositories/sence.repository.js';

const organizationId = '11111111-1111-4111-8111-111111111111';
const otherOrganizationId = '22222222-2222-4222-8222-222222222222';
const trainingSessionId = '33333333-3333-4333-8333-333333333333';
const courseId = '44444444-4444-4444-8444-444444444444';
const enrollmentId = '55555555-5555-4555-8555-555555555555';
const employeeId = '66666666-6666-4666-8666-666666666666';
const documentId = '77777777-7777-4777-8777-777777777777';
const context = {
  organizationId,
  actorUserId: '88888888-8888-4888-8888-888888888888',
};

class FakeSenceRepository implements SenceRepository {
  declarations: SenceDeclaration[] = [];
  documents: SenceDocument[] = [];
  existingDocuments = new Set<string>([documentId]);
  snapshotOverride: Partial<SenceComplianceSnapshot> = {};

  async findById(id: string, inputOrganizationId: string): Promise<SenceDeclaration | null> {
    return (
      this.declarations.find((declaration) => {
        const props = declaration.toPrimitives();
        return declaration.id === id && props.organizationId === inputOrganizationId && !props.deletedAt;
      }) ?? null
    );
  }

  async findByTrainingSession(
    inputOrganizationId: string,
    inputTrainingSessionId: string,
  ): Promise<SenceDeclaration | null> {
    return (
      this.declarations.find((declaration) => {
        const props = declaration.toPrimitives();
        return (
          props.organizationId === inputOrganizationId &&
          props.trainingSessionId === inputTrainingSessionId &&
          !props.deletedAt
        );
      }) ?? null
    );
  }

  async search(
    filters: SenceSearchFilters,
    _pagination: PaginationInput,
  ): Promise<PaginatedResult<SenceDeclaration>> {
    const data = this.declarations.filter((declaration) => {
      const props = declaration.toPrimitives();
      return (
        props.organizationId === filters.organizationId &&
        !props.deletedAt &&
        (filters.trainingSessionId === undefined ||
          props.trainingSessionId === filters.trainingSessionId) &&
        (filters.status === undefined || props.status === filters.status)
      );
    });
    return { data, meta: { page: 1, pageSize: 20, total: data.length, totalPages: 1 } };
  }

  async save(declaration: SenceDeclaration): Promise<void> {
    this.declarations.push(declaration);
  }

  async update(declaration: SenceDeclaration): Promise<void> {
    this.declarations = this.declarations.map((current) =>
      current.id === declaration.id ? declaration : current,
    );
  }

  async attachDocument(document: SenceDocument): Promise<void> {
    this.documents.push(document);
  }

  async listDocuments(
    inputOrganizationId: string,
    declarationId: string,
  ): Promise<SenceDocument[]> {
    return this.documents.filter((document) => {
      const props = document.toPrimitives();
      return props.organizationId === inputOrganizationId && props.senceDeclarationId === declarationId;
    });
  }

  async documentExists(inputOrganizationId: string, inputDocumentId: string): Promise<boolean> {
    return inputOrganizationId === organizationId && this.existingDocuments.has(inputDocumentId);
  }

  async getComplianceSnapshot(
    inputOrganizationId: string,
    declarationId: string,
  ): Promise<SenceComplianceSnapshot | null> {
    const declaration = await this.findById(declarationId, inputOrganizationId);
    if (!declaration) {
      return null;
    }
    return { ...createValidSnapshot(declaration), ...this.snapshotOverride };
  }
}

describe('SENCE module', () => {
  it('creates a SENCE declaration', async () => {
    const repository = new FakeSenceRepository();
    const result = await new CreateSenceDeclarationUseCase(repository).execute(
      { trainingSessionId, senceCode: 'SENCE-001' },
      context,
    );

    expect(result.trainingSessionId).toBe(trainingSessionId);
    expect(result.status).toBe('DRAFT');
  });

  it('validates a declaration with complete participants', async () => {
    const repository = createRepositoryWithDeclaration();
    const declarationId = firstDeclaration(repository).id;
    const result = await new ValidateSenceComplianceUseCase(repository).execute(declarationId, context);

    expect(result.valid).toBe(true);
    expect(result.participantsWithAttendance).toBe(1);
    expect(result.participantsWithCertificates).toBe(1);
  });

  it('fails validation when there are no participants', async () => {
    const repository = createRepositoryWithDeclaration();
    repository.snapshotOverride = { participants: [] };
    const result = await new ValidateSenceComplianceUseCase(repository).execute(
      firstDeclaration(repository).id,
      context,
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('SENCE declaration requires at least one participant');
  });

  it('fails validation when attendance is missing', async () => {
    const repository = createRepositoryWithDeclaration();
    repository.snapshotOverride = {
      participants: [{ ...createParticipant(), hasAttendance: false, attendancePercentage: null }],
    };
    const result = await new ValidateSenceComplianceUseCase(repository).execute(
      firstDeclaration(repository).id,
      context,
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(`Participant ${employeeId} is missing attendance`);
  });

  it('warns when optional evaluation is missing', async () => {
    const repository = createRepositoryWithDeclaration();
    const result = await new ValidateSenceComplianceUseCase(repository).execute(
      firstDeclaration(repository).id,
      context,
    );

    expect(result.warnings).toContain('No participant evaluation results were found');
  });

  it('builds logical evidence', async () => {
    const repository = createRepositoryWithDeclaration();
    const result = await new BuildSenceEvidenceUseCase(repository).execute(
      firstDeclaration(repository).id,
      context,
    );

    expect(result.evidence.map((item) => item.type)).toEqual([
      'SESSION_SUMMARY',
      'PARTICIPANT_LIST',
      'ATTENDANCE_SUMMARY',
      'CERTIFICATE_LIST',
      'EVALUATION_SUMMARY',
      'COURSE_METADATA',
      'INSTRUCTOR_METADATA',
    ]);
  });

  it('marks a declaration ready when validation passes', async () => {
    const repository = createRepositoryWithDeclaration();
    const result = await new MarkSenceDeclarationReadyUseCase(repository).execute(
      firstDeclaration(repository).id,
      context,
    );

    expect(result.status).toBe('READY');
  });

  it('does not mark ready when validation fails', async () => {
    const repository = createRepositoryWithDeclaration();
    repository.snapshotOverride = { participants: [] };

    await expect(
      new MarkSenceDeclarationReadyUseCase(repository).execute(firstDeclaration(repository).id, context),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('submits a ready declaration with manual stub metadata', async () => {
    const repository = createRepositoryWithDeclaration();
    const declarationId = firstDeclaration(repository).id;
    await new MarkSenceDeclarationReadyUseCase(repository).execute(declarationId, context);
    const result = await new SubmitSenceDeclarationUseCase(repository).execute(
      declarationId,
      { comments: 'Manual submission' },
      context,
    );

    expect(result.status).toBe('SUBMITTED');
    expect(result.responsePayload).toMatchObject({ submissionMode: 'MANUAL_STUB' });
  });

  it('updates status to accepted', async () => {
    const repository = createRepositoryWithDeclaration();
    const result = await new UpdateSenceDeclarationStatusUseCase(repository).execute(
      firstDeclaration(repository).id,
      { status: 'ACCEPTED' },
      context,
    );

    expect(result.status).toBe('ACCEPTED');
  });

  it('updates status to rejected with reason', async () => {
    const repository = createRepositoryWithDeclaration();
    const result = await new UpdateSenceDeclarationStatusUseCase(repository).execute(
      firstDeclaration(repository).id,
      { status: 'REJECTED', reason: 'Missing external evidence' },
      context,
    );

    expect(result.status).toBe('REJECTED');
    expect(result.responsePayload).toMatchObject({ statusReason: 'Missing external evidence' });
  });

  it('attaches a document', async () => {
    const repository = createRepositoryWithDeclaration();
    const result = await new AttachSenceDocumentUseCase(repository).execute(
      firstDeclaration(repository).id,
      { documentId, documentType: 'ATTENDANCE_SUMMARY' },
      context,
    );

    expect(result.documentId).toBe(documentId);
    expect(result.documentType).toBe('ATTENDANCE_SUMMARY');
  });

  it('lists attached documents', async () => {
    const repository = createRepositoryWithDeclaration();
    const declarationId = firstDeclaration(repository).id;
    await new AttachSenceDocumentUseCase(repository).execute(
      declarationId,
      { documentId, documentType: 'ATTENDANCE_SUMMARY' },
      context,
    );
    const result = await new ListSenceDocumentsUseCase(repository).execute(declarationId, context);

    expect(result.data).toHaveLength(1);
  });

  it('fails cross-tenant access', async () => {
    const repository = createRepositoryWithDeclaration();

    await expect(
      new ValidateSenceComplianceUseCase(repository).execute(firstDeclaration(repository).id, {
        ...context,
        organizationId: otherOrganizationId,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('gets declaration by training session', async () => {
    const repository = createRepositoryWithDeclaration();
    const result = await new GetSenceDeclarationByTrainingSessionUseCase(repository).execute(
      trainingSessionId,
      context,
    );

    expect(result.id).toBe(firstDeclaration(repository).id);
  });
});

function createRepositoryWithDeclaration(): FakeSenceRepository {
  const repository = new FakeSenceRepository();
  repository.declarations.push(
    SenceDeclaration.create({
      organizationId,
      trainingSessionId,
      senceCode: 'SENCE-001',
    }),
  );
  return repository;
}

function firstDeclaration(repository: FakeSenceRepository): SenceDeclaration {
  const declaration = repository.declarations[0];
  if (!declaration) {
    throw new Error('Test fixture declaration is required');
  }
  return declaration;
}

function createValidSnapshot(declaration: SenceDeclaration): SenceComplianceSnapshot {
  return {
    declaration,
    trainingSession: {
      id: trainingSessionId,
      organizationId,
      courseId,
      instructorId: '99999999-9999-4999-8999-999999999999',
      providerId: null,
      name: 'Safety Session',
      startDate: new Date('2026-06-15T09:00:00.000Z'),
      endDate: new Date('2026-06-15T13:00:00.000Z'),
      status: 'COMPLETED',
    },
    course: {
      id: courseId,
      organizationId,
      code: 'SAFE-101',
      name: 'Safety Basics',
      modality: 'PRESENTIAL',
      durationHours: 4,
      status: 'ACTIVE',
      senceCode: 'SENCE-COURSE',
    },
    participants: [createParticipant()],
    documents: [],
  };
}

function createParticipant() {
  return {
    enrollmentId,
    employeeId,
    enrollmentStatus: 'COMPLETED',
    attendancePercentage: 100,
    hasAttendance: true,
    hasCertificate: true,
    hasEvaluation: false,
    evaluationPassed: null,
    crossTenantIssue: false,
  };
}
