import { describe, expect, it } from 'vitest';

import type { AuditLogInput } from '../../../../shared/application/audit-logger.js';
import type { UseCaseContext } from '../../../../shared/application/use-case-context.js';
import {
  BadRequestError,
  ConflictError,
  ModuleUnavailableError,
  NotFoundError,
} from '../../../../shared/domain/errors.js';
import { OtecProfile } from '../../domain/entities/otec-profile.entity.js';
import { QualityCertification } from '../../domain/entities/quality-certification.entity.js';
import type {
  OtecProfileRepository,
  OtecProfileSearchFilters,
} from '../../domain/repositories/otec-profile.repository.js';
import type {
  QualityCertificationFilters,
  QualityCertificationRepository,
} from '../../domain/repositories/otec-regulatory-record.repositories.js';
import {
  OtecReadinessEvaluator,
  type OtecReadinessSnapshot,
} from '../../domain/services/otec-readiness-evaluator.js';
import type { TenantDocumentOwnershipPort } from '../ports/compliance-reference.ports.js';
import type {
  OtecComplianceTransactionManager,
  OtecComplianceUnitOfWork,
} from '../ports/otec-compliance-unit-of-work.js';
import { CreateQualityCertificationUseCase as AuthorizedCreate } from './create-quality-certification.use-case.js';
import { DeactivateQualityCertificationUseCase as AuthorizedDeactivate } from './deactivate-quality-certification.use-case.js';
import { GetQualityCertificationUseCase as AuthorizedGet } from './get-quality-certification.use-case.js';
import { ListQualityCertificationsUseCase as AuthorizedList } from './list-quality-certifications.use-case.js';
import { UpdateQualityCertificationUseCase as AuthorizedUpdate } from './update-quality-certification.use-case.js';

const tenantId = '25000000-0000-4000-8000-000000000001';
const foreignTenantId = '25000000-0000-4000-8000-000000000002';
const context: UseCaseContext = {
  actorUserId: '25000000-0000-4000-8000-000000000003',
  organizationId: tenantId,
  permissions: ['otec_compliance.read', 'otec_compliance.certification.manage'],
};
const validFrom = new Date('2026-01-01T00:00:00.000Z');
const validUntil = new Date('2027-01-01T00:00:00.000Z');
const evaluatedAt = new Date('2026-07-16T00:00:00.000Z');
const enabled = { evaluate: async () => ({ allowed: true as const, reason: 'ENABLED' as const }) };
class CreateQualityCertificationUseCase extends AuthorizedCreate {
  constructor(tx: OtecComplianceTransactionManager) {
    super(tx, enabled);
  }
}
class DeactivateQualityCertificationUseCase extends AuthorizedDeactivate {
  constructor(tx: OtecComplianceTransactionManager) {
    super(tx, enabled);
  }
}
class GetQualityCertificationUseCase extends AuthorizedGet {
  constructor(repo: QualityCertificationRepository) {
    super(repo, enabled);
  }
}
class ListQualityCertificationsUseCase extends AuthorizedList {
  constructor(repo: QualityCertificationRepository) {
    super(repo, enabled);
  }
}
class UpdateQualityCertificationUseCase extends AuthorizedUpdate {
  constructor(tx: OtecComplianceTransactionManager) {
    super(tx, enabled);
  }
}

describe('QualityCertification use cases', () => {
  it('rejects an unavailable certification entitlement before persistence', async () => {
    const profile = OtecProfile.create({ organizationId: tenantId });
    const state = createState([profile]);
    const disabled = {
      evaluate: async () => ({ allowed: false as const, reason: 'DISABLED' as const }),
    };
    await expect(
      new AuthorizedCreate(new InMemoryTransactionManager(state), disabled).execute(
        createInput(profile.id),
        context,
      ),
    ).rejects.toBeInstanceOf(ModuleUnavailableError);
    expect(state.certifications).toHaveLength(0);
    expect(state.audits).toHaveLength(0);
  });
  it.each(['ISO_9001', 'NCH_2728'] as const)(
    'creates and audits a valid %s certification under the context tenant',
    async (certificationType) => {
      const profile = OtecProfile.create({ organizationId: tenantId });
      const state = createState([profile]);
      const result = await new CreateQualityCertificationUseCase(
        new InMemoryTransactionManager(state),
      ).execute(
        {
          organizationId: foreignTenantId,
          otecProfileId: profile.id,
          certificationType,
          certificationNumber: `${certificationType}-001`,
          certifyingEntity: 'Fictitious Internal Entity',
          validFrom,
          validUntil,
        },
        context,
      );
      expect(result).toMatchObject({
        organizationId: tenantId,
        certificationType,
        status: 'ACTIVE',
        version: 1,
      });
      expect(state.audits.at(-1)).toMatchObject({
        action: 'QUALITY_CERTIFICATION_CREATED',
        organizationId: tenantId,
      });
    },
  );

  it('rejects missing/foreign profile, invalid dates/type, foreign document, and duplicate without persistence', async () => {
    const ownProfile = OtecProfile.create({ organizationId: tenantId });
    const foreignProfile = OtecProfile.create({ organizationId: foreignTenantId });
    const duplicate = certification(ownProfile.id, { certificationNumber: 'DUPLICATE' });
    const state = createState([ownProfile, foreignProfile], [duplicate]);
    const useCase = new CreateQualityCertificationUseCase(new InMemoryTransactionManager(state));
    await expect(useCase.execute(createInput('missing'), context)).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await expect(useCase.execute(createInput(foreignProfile.id), context)).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await expect(
      useCase.execute(
        { ...createInput(ownProfile.id), validFrom: validUntil, validUntil: validFrom },
        context,
      ),
    ).rejects.toBeInstanceOf(BadRequestError);
    await expect(
      useCase.execute({ ...createInput(ownProfile.id), certificationType: 'UNSUPPORTED' }, context),
    ).rejects.toBeInstanceOf(BadRequestError);
    await expect(
      useCase.execute({ ...createInput(ownProfile.id), documentId: 'foreign-document' }, context),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      useCase.execute({ ...createInput(ownProfile.id), certificationNumber: 'DUPLICATE' }, context),
    ).rejects.toBeInstanceOf(ConflictError);
    expect(state.certifications).toHaveLength(1);
    expect(state.audits).toHaveLength(0);
  });

  it('rolls back creation when audit fails', async () => {
    const profile = OtecProfile.create({ organizationId: tenantId });
    const state = createState([profile]);
    state.failAudit = true;
    await expect(
      new CreateQualityCertificationUseCase(new InMemoryTransactionManager(state)).execute(
        createInput(profile.id),
        context,
      ),
    ).rejects.toThrow('Audit failed');
    expect(state.certifications).toHaveLength(0);
  });

  it('lists tenant records with type/status/current/expired/upcoming filters, pagination, stable order, and empty result', async () => {
    const records = [
      certification('p', { certificationNumber: 'CURRENT-A', createdAt: new Date('2026-01-01') }),
      certification('p', { certificationNumber: 'CURRENT-B', createdAt: new Date('2026-02-01') }),
      certification('p', { certificationNumber: 'UPCOMING', validUntil: new Date('2026-07-25') }),
      certification('p', {
        certificationNumber: 'EXPIRED',
        validFrom: new Date('2025-01-01'),
        validUntil: new Date('2025-12-31'),
      }),
      certification('p', { certificationNumber: 'ISO', certificationType: 'ISO_9001' }),
      certification('p', { certificationNumber: 'DELETED', deletedAt: new Date() }),
      certification('p', { organizationId: foreignTenantId, certificationNumber: 'FOREIGN' }),
    ];
    const useCase = new ListQualityCertificationsUseCase(
      new InMemoryCertificationRepository(records),
    );
    const page = await useCase.execute(
      { certificationType: 'NCH_2728', status: 'ACTIVE', validAt: evaluatedAt },
      { page: 1, pageSize: 2 },
      context,
    );
    expect(page.meta).toMatchObject({ total: 3, totalPages: 2 });
    expect(page.data.map((item) => item.certificationNumber)).toEqual(['UPCOMING', 'CURRENT-B']);
    const expired = await useCase.execute(
      { validUntilBefore: evaluatedAt },
      { page: 1, pageSize: 10 },
      context,
    );
    expect(expired.data.map((item) => item.certificationNumber)).toEqual(['EXPIRED']);
    const upcoming = await useCase.execute(
      { validUntilFrom: evaluatedAt, validUntilBefore: new Date('2026-07-31') },
      { page: 1, pageSize: 10 },
      context,
    );
    expect(upcoming.data.map((item) => item.certificationNumber)).toEqual(['UPCOMING']);
    await expect(
      useCase.execute({}, { page: 1, pageSize: 10 }, { ...context, organizationId: 'empty' }),
    ).resolves.toMatchObject({ data: [] });
  });

  it('gets only own non-deleted certification', async () => {
    const own = certification('p');
    const foreign = certification('p', { organizationId: foreignTenantId });
    const deleted = certification('p', { deletedAt: new Date() });
    const useCase = new GetQualityCertificationUseCase(
      new InMemoryCertificationRepository([own, foreign, deleted]),
    );
    await expect(useCase.execute(own.id, context)).resolves.toMatchObject({ id: own.id });
    await expect(useCase.execute(foreign.id, context)).rejects.toBeInstanceOf(NotFoundError);
    await expect(useCase.execute(deleted.id, context)).rejects.toBeInstanceOf(NotFoundError);
    await expect(useCase.execute('missing', context)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('updates with expectedVersion, same-tenant document ownership, version increment, and before/after audit', async () => {
    const record = certification('p');
    const state = createState([], [record]);
    state.ownedDocuments.add('owned-document');
    const result = await new UpdateQualityCertificationUseCase(
      new InMemoryTransactionManager(state),
    ).execute(
      record.id,
      { expectedVersion: 1, notes: 'Updated', documentId: 'owned-document' },
      context,
    );
    expect(result).toMatchObject({ notes: 'Updated', documentId: 'owned-document', version: 2 });
    expect(state.lastExpectedVersion).toBe(1);
    expect(state.audits.at(-1)?.before).toBeDefined();
    expect(state.audits.at(-1)?.after).toBeDefined();
  });

  it('rejects stale update, invalid range, tenant/profile changes, and foreign document', async () => {
    const record = certification('p');
    const state = createState([], [record]);
    const useCase = new UpdateQualityCertificationUseCase(new InMemoryTransactionManager(state));
    state.conflictOnUpdate = true;
    await expect(
      useCase.execute(record.id, { expectedVersion: 0, notes: 'stale' }, context),
    ).rejects.toBeInstanceOf(ConflictError);
    state.conflictOnUpdate = false;
    await expect(
      useCase.execute(
        record.id,
        { expectedVersion: 1, validFrom: validUntil, validUntil: validFrom },
        context,
      ),
    ).rejects.toBeInstanceOf(BadRequestError);
    await expect(
      useCase.execute(record.id, { expectedVersion: 1, organizationId: foreignTenantId }, context),
    ).rejects.toBeInstanceOf(BadRequestError);
    await expect(
      useCase.execute(record.id, { expectedVersion: 1, otecProfileId: 'other' }, context),
    ).rejects.toBeInstanceOf(BadRequestError);
    await expect(
      useCase.execute(record.id, { expectedVersion: 1, documentId: 'foreign' }, context),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('rolls back update when audit fails', async () => {
    const record = certification('p', { notes: 'Before' });
    const state = createState([], [record]);
    state.failAudit = true;
    await expect(
      new UpdateQualityCertificationUseCase(new InMemoryTransactionManager(state)).execute(
        record.id,
        { expectedVersion: 1, notes: 'After' },
        context,
      ),
    ).rejects.toThrow('Audit failed');
    expect(state.certifications[0]?.toPrimitives().notes).toBe('Before');
  });

  it('soft-deactivates once with expectedVersion and audit, rejects stale/cross-tenant/second attempt, and rolls back audit failure', async () => {
    const own = certification('p');
    const foreign = certification('p', { organizationId: foreignTenantId });
    const state = createState([], [own, foreign]);
    const useCase = new DeactivateQualityCertificationUseCase(
      new InMemoryTransactionManager(state),
    );
    const result = await useCase.execute(own.id, { expectedVersion: 1 }, context);
    expect(result).toMatchObject({ status: 'INACTIVE', version: 2 });
    expect(result.deletedAt).toBeInstanceOf(Date);
    expect(state.audits.at(-1)).toMatchObject({ action: 'QUALITY_CERTIFICATION_DEACTIVATED' });
    await expect(useCase.execute(own.id, { expectedVersion: 2 }, context)).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await expect(
      useCase.execute(foreign.id, { expectedVersion: 1 }, context),
    ).rejects.toBeInstanceOf(NotFoundError);
    const conflict = certification('p');
    const conflictState = createState([], [conflict]);
    conflictState.conflictOnUpdate = true;
    await expect(
      new DeactivateQualityCertificationUseCase(
        new InMemoryTransactionManager(conflictState),
      ).execute(conflict.id, { expectedVersion: 0 }, context),
    ).rejects.toBeInstanceOf(ConflictError);
    const rollback = certification('p');
    const rollbackState = createState([], [rollback]);
    rollbackState.failAudit = true;
    await expect(
      new DeactivateQualityCertificationUseCase(
        new InMemoryTransactionManager(rollbackState),
      ).execute(rollback.id, { expectedVersion: 1 }, context),
    ).rejects.toThrow('Audit failed');
    expect(rollbackState.certifications[0]?.toPrimitives()).toMatchObject({
      status: 'ACTIVE',
      deletedAt: null,
      version: 1,
    });
  });

  it('evaluates required NCh2728 as ready, missing/expired as blocking, optional as non-blocking, and upcoming as warning', async () => {
    const evaluator = new OtecReadinessEvaluator();
    const snapshot = readySnapshot();
    expect(
      evaluator
        .evaluate(snapshot, evaluatedAt)
        .blockingIssues.find((item) => item.ruleCode === 'OTEC-QUAL-001'),
    ).toBeUndefined();
    snapshot.certifications = [];
    expect(evaluator.evaluate(snapshot, evaluatedAt).blockingIssues).toContainEqual(
      expect.objectContaining({ ruleCode: 'OTEC-QUAL-001' }),
    );
    snapshot.certifications = [{ ...effectiveCertification(), validUntil: new Date('2026-07-15') }];
    expect(evaluator.evaluate(snapshot, evaluatedAt).status).toBe('NOT_READY');
    snapshot.settings.requireNch2728 = false;
    snapshot.certifications = [];
    expect(
      evaluator
        .evaluate(snapshot, evaluatedAt)
        .blockingIssues.find((item) => item.ruleCode === 'OTEC-QUAL-001'),
    ).toBeUndefined();
    snapshot.settings.requireNch2728 = true;
    snapshot.certifications = [{ ...effectiveCertification(), validUntil: new Date('2026-07-25') }];
    expect(evaluator.evaluate(snapshot, evaluatedAt).warnings).toContainEqual(
      expect.objectContaining({ ruleCode: 'OTEC-QUAL-001' }),
    );
  });

  it('does not count soft-deleted or foreign NCh2728 records in the authorized readiness snapshot', async () => {
    const ownDeleted = certification('p', { deletedAt: new Date() });
    const foreign = certification('p', { organizationId: foreignTenantId });
    const listed = await new ListQualityCertificationsUseCase(
      new InMemoryCertificationRepository([ownDeleted, foreign]),
    ).execute(
      { certificationType: 'NCH_2728', status: 'ACTIVE', validAt: evaluatedAt },
      { page: 1, pageSize: 10 },
      context,
    );
    const snapshot = readySnapshot();
    snapshot.certifications = listed.data.map((item) => ({
      id: item.id,
      status: item.status,
      validFrom: item.validFrom,
      validUntil: item.validUntil,
      certificationType: item.certificationType,
    }));
    expect(
      new OtecReadinessEvaluator().evaluate(snapshot, evaluatedAt).blockingIssues,
    ).toContainEqual(expect.objectContaining({ ruleCode: 'OTEC-QUAL-001' }));
  });
});

interface State {
  profiles: OtecProfile[];
  certifications: QualityCertification[];
  audits: AuditLogInput[];
  ownedDocuments: Set<string>;
  failAudit: boolean;
  conflictOnUpdate: boolean;
  lastExpectedVersion: number | null;
  certificationRepository: InMemoryCertificationRepository;
  profileRepository: InMemoryProfileRepository;
  documentOwnership: TenantDocumentOwnershipPort;
}
function createState(
  profiles: OtecProfile[] = [],
  certifications: QualityCertification[] = [],
): State {
  const state = {
    profiles,
    certifications,
    audits: [],
    ownedDocuments: new Set<string>(),
    failAudit: false,
    conflictOnUpdate: false,
    lastExpectedVersion: null,
  } as unknown as State;
  state.certificationRepository = new InMemoryCertificationRepository(certifications, state);
  state.profileRepository = new InMemoryProfileRepository(profiles);
  state.documentOwnership = {
    belongsToTenant: async (_organizationId, documentId) => state.ownedDocuments.has(documentId),
  };
  return state;
}
class InMemoryTransactionManager implements OtecComplianceTransactionManager {
  constructor(private readonly state: State) {}
  async run<TResult>(
    work: (unitOfWork: OtecComplianceUnitOfWork) => Promise<TResult>,
  ): Promise<TResult> {
    const props = this.state.certifications.map((item) => item.toPrimitives());
    const audits = [...this.state.audits];
    try {
      return await work({
        transactionBoundary: 'UNIT_OF_WORK',
        otecAccreditationRepository: {} as never,
        otecOfficeRepository: {} as never,
        legalRepresentativeRepository: {} as never,
        otecResolutionRepository: {} as never,
        otecProfileRepository: this.state.profileRepository,
        qualityCertificationRepository: this.state.certificationRepository,
        documentOwnership: this.state.documentOwnership,
        auditLogger: {
          record: async (input) => {
            if (this.state.failAudit) throw new Error('Audit failed');
            this.state.audits.push(input);
          },
        },
      });
    } catch (error) {
      this.state.certifications.splice(
        0,
        this.state.certifications.length,
        ...props.map(QualityCertification.rehydrate),
      );
      this.state.audits.splice(0, this.state.audits.length, ...audits);
      throw error;
    }
  }
}
class InMemoryCertificationRepository implements QualityCertificationRepository {
  constructor(
    private readonly records: QualityCertification[],
    private readonly state?: State,
  ) {}
  async findById(organizationId: string, id: string) {
    return (
      this.records.find((item) => {
        const p = item.toPrimitives();
        return p.organizationId === organizationId && p.id === id && p.deletedAt === null;
      }) ?? null
    );
  }
  async search(
    organizationId: string,
    filters: QualityCertificationFilters,
    pagination: { page: number; pageSize: number },
  ) {
    const data = this.records
      .filter((item) => {
        const p = item.toPrimitives();
        return (
          p.organizationId === organizationId &&
          p.deletedAt === null &&
          (!filters.certificationType || p.certificationType === filters.certificationType) &&
          (!filters.status || p.status === filters.status) &&
          (!filters.validAt ||
            ((!p.validFrom || p.validFrom <= filters.validAt) &&
              (!p.validUntil || p.validUntil >= filters.validAt))) &&
          (!filters.validUntilBefore ||
            (!!p.validUntil && p.validUntil <= filters.validUntilBefore)) &&
          (!filters.validUntilFrom || (!!p.validUntil && p.validUntil >= filters.validUntilFrom))
        );
      })
      .sort(
        (a, b) =>
          b.toPrimitives().createdAt.getTime() - a.toPrimitives().createdAt.getTime() ||
          a.id.localeCompare(b.id),
      );
    const start = (pagination.page - 1) * pagination.pageSize;
    return {
      data: data.slice(start, start + pagination.pageSize),
      meta: {
        ...pagination,
        total: data.length,
        totalPages: Math.ceil(data.length / pagination.pageSize),
      },
    };
  }
  async save(entity: QualityCertification) {
    const p = entity.toPrimitives();
    if (
      this.records.some((item) => {
        const e = item.toPrimitives();
        return (
          e.organizationId === p.organizationId &&
          e.otecProfileId === p.otecProfileId &&
          e.certificationNumber === p.certificationNumber &&
          e.status === 'ACTIVE' &&
          e.deletedAt === null
        );
      })
    )
      throw new ConflictError('Duplicate');
    this.records.push(entity);
  }
  async update(_entity: QualityCertification, expectedVersion: number) {
    if (this.state) {
      this.state.lastExpectedVersion = expectedVersion;
      if (this.state.conflictOnUpdate) throw new ConflictError('Stale');
    }
  }
}
class InMemoryProfileRepository implements OtecProfileRepository {
  constructor(private readonly records: OtecProfile[]) {}
  async findCurrentByOrganizationId(organizationId: string) {
    return (
      this.records.find((item) => {
        const props = item.toPrimitives();
        return props.organizationId === organizationId && props.registrationStatus === 'ACTIVE' && props.deletedAt === null;
      }) ?? null
    );
  }
  async findById(organizationId: string, id: string) {
    return (
      this.records.find((item) => {
        const p = item.toPrimitives();
        return p.organizationId === organizationId && p.id === id && p.deletedAt === null;
      }) ?? null
    );
  }
  async search(
    _organizationId: string,
    _filters: OtecProfileSearchFilters,
    pagination: { page: number; pageSize: number },
  ) {
    return { data: [], meta: { ...pagination, total: 0, totalPages: 0 } };
  }
  async save(item: OtecProfile) {
    this.records.push(item);
  }
  async update() {
    return undefined;
  }
}
function certification(
  profileId: string,
  overrides: Partial<ReturnType<QualityCertification['toPrimitives']>> = {},
) {
  const item = QualityCertification.create({
    organizationId: overrides.organizationId ?? tenantId,
    otecProfileId: profileId,
    certificationType: overrides.certificationType ?? 'NCH_2728',
    certificationNumber: overrides.certificationNumber ?? `CERT-${Math.random().toString()}`,
    certifyingEntity: 'Fictitious Entity',
    validFrom: overrides.validFrom ?? validFrom,
    validUntil: overrides.validUntil ?? validUntil,
  });
  return QualityCertification.rehydrate({ ...item.toPrimitives(), ...overrides });
}
function createInput(otecProfileId: string) {
  return {
    otecProfileId,
    certificationType: 'NCH_2728' as const,
    certificationNumber: 'CERT-NEW',
    certifyingEntity: 'Fictitious Entity',
    validFrom,
    validUntil,
  };
}
function effectiveCertification() {
  return { id: 'cert', status: 'ACTIVE', validFrom, validUntil, certificationType: 'NCH_2728' };
}
function readySnapshot(): OtecReadinessSnapshot {
  return {
    organization: { id: tenantId, type: 'OTEC', status: 'ACTIVE' },
    profile: { id: 'p', status: 'ACTIVE' },
    settings: {
      requireNch2728: true,
      requiredResolutionTypes: [],
      qualifyingOfficeTypes: ['HEADQUARTERS'],
      expirationWarningDays: [30],
      undatedRecordTreatment: 'WARNING',
    },
    accreditations: [{ id: 'a', status: 'ACTIVE', validFrom, validUntil }],
    certifications: [effectiveCertification()],
    offices: [{ id: 'o', status: 'ACTIVE', validFrom, validUntil, officeType: 'HEADQUARTERS' }],
    representatives: [{ id: 'r', status: 'ACTIVE', validFrom, validUntil, active: true }],
    resolutions: [],
  };
}
