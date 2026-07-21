import { describe, expect, it } from 'vitest';
import type { AuditLogInput } from '../../../../shared/application/audit-logger.js';
import type { UseCaseContext } from '../../../../shared/application/use-case-context.js';
import {
  BadRequestError,
  ConflictError,
  ModuleUnavailableError,
  NotFoundError,
} from '../../../../shared/domain/errors.js';
import { LegalRepresentative } from '../../domain/entities/legal-representative.entity.js';
import { OtecProfile } from '../../domain/entities/otec-profile.entity.js';
import type {
  OtecProfileRepository,
  OtecProfileSearchFilters,
} from '../../domain/repositories/otec-profile.repository.js';
import type {
  LegalRepresentativeFilters,
  LegalRepresentativeRepository,
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
import { CreateLegalRepresentativeUseCase } from './create-legal-representative.use-case.js';
import { DeactivateLegalRepresentativeUseCase } from './deactivate-legal-representative.use-case.js';
import { GetLegalRepresentativeUseCase } from './get-legal-representative.use-case.js';
import { ListLegalRepresentativesUseCase } from './list-legal-representatives.use-case.js';
import { UpdateLegalRepresentativeUseCase } from './update-legal-representative.use-case.js';

const tenantId = '27000000-0000-4000-8000-000000000001';
const foreignTenantId = '27000000-0000-4000-8000-000000000002';
const context: UseCaseContext = {
  actorUserId: '27000000-0000-4000-8000-000000000003',
  organizationId: tenantId,
  permissions: ['otec_compliance.read', 'otec_compliance.representative.manage'],
};
const evaluatedAt = new Date('2026-07-16T00:00:00.000Z');
const validFrom = new Date('2026-01-01');
const validUntil = new Date('2027-01-01');
const enabledAccess = {
  evaluate: async () => ({ allowed: true as const, reason: 'ENABLED' as const }),
};
const disabledAccess = {
  evaluate: async () => ({ allowed: false as const, reason: 'DISABLED' as const }),
};
const now = () => evaluatedAt;

describe('LegalRepresentative use cases', () => {
  it('creates a valid representative under the context tenant and writes a PII-minimized audit', async () => {
    const profile = OtecProfile.create({ organizationId: tenantId });
    const state = createState([profile]);
    state.ownedDocuments.add('owned-document');
    const result = await new CreateLegalRepresentativeUseCase(
      new InMemoryTransactionManager(state),
      enabledAccess,
      now,
    ).execute(
      {
        ...createInput(profile.id),
        organizationId: foreignTenantId,
        appointmentDocumentId: 'owned-document',
      },
      context,
    );
    expect(result).toMatchObject({
      organizationId: tenantId,
      taxId: '123456785',
      email: 'person@example.test',
      active: true,
      version: 1,
    });
    const audit = state.audits.at(-1);
    expect(audit).toMatchObject({
      organizationId: tenantId,
      action: 'LEGAL_REPRESENTATIVE_CREATED',
    });
    expect(JSON.stringify(audit)).not.toContain('123456785');
    expect(JSON.stringify(audit)).not.toContain('person@example.test');
    expect(JSON.stringify(audit)).not.toContain('+56912345678');
  });

  it('rejects unavailable entitlement without writes', async () => {
    const profile = OtecProfile.create({ organizationId: tenantId });
    const state = createState([profile]);
    await expect(
      new CreateLegalRepresentativeUseCase(
        new InMemoryTransactionManager(state),
        disabledAccess,
        now,
      ).execute(createInput(profile.id), context),
    ).rejects.toBeInstanceOf(ModuleUnavailableError);
    expect(state.representatives).toHaveLength(0);
  });

  it('rejects missing, inactive, and foreign profiles', async () => {
    const inactive = OtecProfile.rehydrate({
      ...OtecProfile.create({ organizationId: tenantId }).toPrimitives(),
      registrationStatus: 'INACTIVE',
    });
    const foreign = OtecProfile.create({ organizationId: foreignTenantId });
    const useCase = new CreateLegalRepresentativeUseCase(
      new InMemoryTransactionManager(createState([inactive, foreign])),
      enabledAccess,
      now,
    );
    await expect(useCase.execute(createInput('missing'), context)).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await expect(useCase.execute(createInput(inactive.id), context)).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await expect(useCase.execute(createInput(foreign.id), context)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('validates RUT, email, dates, required fields, and document ownership without partial writes', async () => {
    const profile = OtecProfile.create({ organizationId: tenantId });
    const state = createState([profile]);
    const useCase = new CreateLegalRepresentativeUseCase(
      new InMemoryTransactionManager(state),
      enabledAccess,
      now,
    );
    await expect(
      useCase.execute({ ...createInput(profile.id), taxId: 'invalid' }, context),
    ).rejects.toBeInstanceOf(BadRequestError);
    await expect(
      useCase.execute({ ...createInput(profile.id), email: 'invalid' }, context),
    ).rejects.toBeInstanceOf(BadRequestError);
    await expect(
      useCase.execute(
        { ...createInput(profile.id), validFrom: validUntil, validUntil: validFrom },
        context,
      ),
    ).rejects.toBeInstanceOf(BadRequestError);
    await expect(
      useCase.execute({ ...createInput(profile.id), firstName: ' ' }, context),
    ).rejects.toBeInstanceOf(BadRequestError);
    await expect(
      useCase.execute({ ...createInput(profile.id), appointmentDocumentId: 'foreign' }, context),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(state.representatives).toHaveLength(0);
    expect(state.audits).toHaveLength(0);
  });

  it('allows multiple active representatives with the same syntactically valid RUT because no uniqueness rule/index exists', async () => {
    const profile = OtecProfile.create({ organizationId: tenantId });
    const state = createState([profile]);
    const useCase = new CreateLegalRepresentativeUseCase(
      new InMemoryTransactionManager(state),
      enabledAccess,
      now,
    );
    await useCase.execute(createInput(profile.id), context);
    await useCase.execute({ ...createInput(profile.id), firstName: 'Second' }, context);
    expect(state.representatives).toHaveLength(2);
  });

  it('rolls back creation when AuditLogger fails', async () => {
    const profile = OtecProfile.create({ organizationId: tenantId });
    const state = createState([profile]);
    state.failAudit = true;
    await expect(
      new CreateLegalRepresentativeUseCase(
        new InMemoryTransactionManager(state),
        enabledAccess,
        now,
      ).execute(createInput(profile.id), context),
    ).rejects.toThrow('Audit failed');
    expect(state.representatives).toHaveLength(0);
  });

  it('lists only tenant non-deleted representatives with active/effective/expired filters and deterministic pagination', async () => {
    const records = [
      representative('p', { firstName: 'A', createdAt: new Date('2026-01-01') }),
      representative('p', { firstName: 'B', createdAt: new Date('2026-02-01') }),
      representative('p', {
        firstName: 'Expired',
        validFrom: new Date('2025-01-01'),
        validUntil: new Date('2025-12-31'),
      }),
      representative('p', { firstName: 'Inactive', active: false }),
      representative('p', { firstName: 'Deleted', deletedAt: evaluatedAt }),
      representative('p', { organizationId: foreignTenantId, firstName: 'Foreign' }),
    ];
    const useCase = new ListLegalRepresentativesUseCase(
      new InMemoryTransactionManager(createState([], records)),
      enabledAccess,
      now,
    );
    const page = await useCase.execute(
      { status: 'ACTIVE', validAt: evaluatedAt },
      { page: 1, pageSize: 1 },
      context,
    );
    expect(page.meta).toMatchObject({ total: 2, totalPages: 2 });
    expect(page.data[0]?.firstName).toBe('B');
    expect(
      (await useCase.execute({ status: 'INACTIVE' }, { page: 1, pageSize: 10 }, context)).data,
    ).toHaveLength(1);
    expect(
      (
        await useCase.execute({ validUntilBefore: evaluatedAt }, { page: 1, pageSize: 10 }, context)
      ).data.map((x) => x.firstName),
    ).toEqual(['Expired']);
    await expect(
      useCase.execute({}, { page: 1, pageSize: 10 }, { ...context, organizationId: 'empty' }),
    ).resolves.toMatchObject({ data: [] });
  });

  it('gets only tenant-owned non-deleted representatives', async () => {
    const own = representative('p');
    const foreign = representative('p', { organizationId: foreignTenantId });
    const deleted = representative('p', { deletedAt: evaluatedAt });
    const useCase = new GetLegalRepresentativeUseCase(
      new InMemoryTransactionManager(createState([], [own, foreign, deleted])),
      enabledAccess,
      now,
    );
    await expect(useCase.execute(own.id, context)).resolves.toMatchObject({ id: own.id });
    await expect(useCase.execute(foreign.id, context)).rejects.toBeInstanceOf(NotFoundError);
    await expect(useCase.execute(deleted.id, context)).rejects.toBeInstanceOf(NotFoundError);
    await expect(useCase.execute('missing', context)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('updates with expectedVersion, owned document, version increment, and safe before/after audit', async () => {
    const record = representative('p');
    const state = createState([], [record]);
    state.ownedDocuments.add('owned');
    const result = await new UpdateLegalRepresentativeUseCase(
      new InMemoryTransactionManager(state),
      enabledAccess,
      now,
    ).execute(
      record.id,
      {
        expectedVersion: 1,
        firstName: ' Updated ',
        taxId: '11.111.111-1',
        appointmentDocumentId: 'owned',
      },
      context,
    );
    expect(result).toMatchObject({ firstName: 'Updated', taxId: '111111111', version: 2 });
    expect(state.lastExpectedVersion).toBe(1);
    const audit = state.audits.at(-1);
    expect(audit?.before).toBeDefined();
    expect(audit?.after).toBeDefined();
    expect(JSON.stringify(audit)).not.toContain('111111111');
  });

  it('rejects stale, invalid, scope-changing, foreign-document, and cross-tenant updates without mutation', async () => {
    const own = representative('p', { firstName: 'Before' });
    const foreign = representative('p', { organizationId: foreignTenantId });
    const state = createState([], [own, foreign]);
    const useCase = new UpdateLegalRepresentativeUseCase(
      new InMemoryTransactionManager(state),
      enabledAccess,
      now,
    );
    state.conflictOnUpdate = true;
    await expect(
      useCase.execute(own.id, { expectedVersion: 0, firstName: 'Stale' }, context),
    ).rejects.toBeInstanceOf(ConflictError);
    state.conflictOnUpdate = false;
    await expect(
      useCase.execute(own.id, { expectedVersion: 1, taxId: 'invalid' }, context),
    ).rejects.toBeInstanceOf(BadRequestError);
    await expect(
      useCase.execute(
        own.id,
        { expectedVersion: 1, validFrom: validUntil, validUntil: validFrom },
        context,
      ),
    ).rejects.toBeInstanceOf(BadRequestError);
    await expect(
      useCase.execute(own.id, { expectedVersion: 1, organizationId: foreignTenantId }, context),
    ).rejects.toBeInstanceOf(BadRequestError);
    await expect(
      useCase.execute(own.id, { expectedVersion: 1, otecProfileId: 'other' }, context),
    ).rejects.toBeInstanceOf(BadRequestError);
    await expect(
      useCase.execute(own.id, { expectedVersion: 1, appointmentDocumentId: 'foreign' }, context),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      useCase.execute(foreign.id, { expectedVersion: 1, firstName: 'No' }, context),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(state.representatives[0]?.toPrimitives().firstName).toBe('Before');
  });

  it('rolls back update and explicit soft deactivation when audit fails', async () => {
    const update = representative('p', { firstName: 'Before' });
    const updateState = createState([], [update]);
    updateState.failAudit = true;
    await expect(
      new UpdateLegalRepresentativeUseCase(
        new InMemoryTransactionManager(updateState),
        enabledAccess,
        now,
      ).execute(update.id, { expectedVersion: 1, firstName: 'After' }, context),
    ).rejects.toThrow('Audit failed');
    expect(updateState.representatives[0]?.toPrimitives()).toMatchObject({
      firstName: 'Before',
      version: 1,
    });
    const deactivate = representative('p');
    const deactivateState = createState([], [deactivate]);
    deactivateState.failAudit = true;
    await expect(
      new DeactivateLegalRepresentativeUseCase(
        new InMemoryTransactionManager(deactivateState),
        enabledAccess,
        now,
      ).execute(deactivate.id, { expectedVersion: 1 }, context),
    ).rejects.toThrow('Audit failed');
    expect(deactivateState.representatives[0]?.toPrimitives()).toMatchObject({
      active: true,
      deletedAt: null,
      version: 1,
    });
  });

  it('soft-deactivates once, preserves history, and rejects stale and cross-tenant attempts', async () => {
    const own = representative('p');
    const foreign = representative('p', { organizationId: foreignTenantId });
    const state = createState([], [own, foreign]);
    const useCase = new DeactivateLegalRepresentativeUseCase(
      new InMemoryTransactionManager(state),
      enabledAccess,
      now,
    );
    const result = await useCase.execute(
      own.id,
      { expectedVersion: 1, reason: 'Appointment ended' },
      context,
    );
    expect(result).toMatchObject({ active: false, version: 2, deletedAt: evaluatedAt });
    expect(state.representatives).toHaveLength(2);
    expect(state.audits.at(-1)).toMatchObject({ action: 'LEGAL_REPRESENTATIVE_DEACTIVATED' });
    await expect(useCase.execute(own.id, { expectedVersion: 2 }, context)).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await expect(
      useCase.execute(foreign.id, { expectedVersion: 1 }, context),
    ).rejects.toBeInstanceOf(NotFoundError);
    const stale = representative('p');
    const staleState = createState([], [stale]);
    staleState.conflictOnUpdate = true;
    await expect(
      new DeactivateLegalRepresentativeUseCase(
        new InMemoryTransactionManager(staleState),
        enabledAccess,
        now,
      ).execute(stale.id, { expectedVersion: 0 }, context),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('evaluates OTEC-REP-001 for active, inactive, future, expired, historical, multiple, and missing evidence', () => {
    const evaluator = new OtecReadinessEvaluator();
    const snapshot = readySnapshot();
    expect(repCheck(evaluator.evaluate(snapshot, evaluatedAt).blockingIssues)).toBeUndefined();
    snapshot.representatives = [{ ...effectiveRepresentative(), active: false }];
    expect(repCheck(evaluator.evaluate(snapshot, evaluatedAt).blockingIssues)).toBeDefined();
    snapshot.representatives = [
      { ...effectiveRepresentative(), validFrom: new Date('2026-08-01') },
    ];
    expect(repCheck(evaluator.evaluate(snapshot, evaluatedAt).blockingIssues)).toBeDefined();
    snapshot.representatives = [
      { ...effectiveRepresentative(), validUntil: new Date('2026-07-15') },
    ];
    expect(repCheck(evaluator.evaluate(snapshot, evaluatedAt).blockingIssues)).toBeDefined();
    expect(
      repCheck(evaluator.evaluate(snapshot, new Date('2026-07-01')).blockingIssues),
    ).toBeUndefined();
    snapshot.representatives = [effectiveRepresentative(), effectiveRepresentative('second')];
    expect(repCheck(evaluator.evaluate(snapshot, evaluatedAt).blockingIssues)).toBeUndefined();
    snapshot.representatives = [];
    expect(evaluator.evaluate(snapshot, evaluatedAt).status).toBe('NOT_READY');
  });

  it('does not count soft-deleted or foreign representatives in an authorized readiness snapshot', async () => {
    const listed = await new ListLegalRepresentativesUseCase(
      new InMemoryTransactionManager(
        createState(
          [],
          [
            representative('p', { deletedAt: evaluatedAt }),
            representative('p', { organizationId: foreignTenantId }),
          ],
        ),
      ),
      enabledAccess,
      now,
    ).execute({ status: 'ACTIVE', validAt: evaluatedAt }, { page: 1, pageSize: 10 }, context);
    const snapshot = readySnapshot();
    snapshot.representatives = listed.data.map((x) => ({
      id: x.id,
      status: x.active ? 'ACTIVE' : 'INACTIVE',
      active: x.active,
      validFrom: x.validFrom,
      validUntil: x.validUntil,
    }));
    expect(
      repCheck(new OtecReadinessEvaluator().evaluate(snapshot, evaluatedAt).blockingIssues),
    ).toBeDefined();
  });
});

interface State {
  profiles: OtecProfile[];
  representatives: LegalRepresentative[];
  audits: AuditLogInput[];
  ownedDocuments: Set<string>;
  failAudit: boolean;
  conflictOnUpdate: boolean;
  lastExpectedVersion: number | null;
  repository: InMemoryRepresentativeRepository;
  profileRepository: InMemoryProfileRepository;
  documentOwnership: TenantDocumentOwnershipPort;
}
function createState(
  profiles: OtecProfile[] = [],
  representatives: LegalRepresentative[] = [],
): State {
  const state = {
    profiles,
    representatives,
    audits: [],
    ownedDocuments: new Set<string>(),
    failAudit: false,
    conflictOnUpdate: false,
    lastExpectedVersion: null,
  } as unknown as State;
  state.repository = new InMemoryRepresentativeRepository(representatives, state);
  state.profileRepository = new InMemoryProfileRepository(profiles);
  state.documentOwnership = {
    belongsToTenant: async (_organizationId, documentId) => state.ownedDocuments.has(documentId),
  };
  return state;
}
class InMemoryTransactionManager implements OtecComplianceTransactionManager {
  constructor(private readonly state: State) {}
  async run<TResult>(work: (uow: OtecComplianceUnitOfWork) => Promise<TResult>): Promise<TResult> {
    const before = this.state.representatives.map((x) => x.toPrimitives());
    const audits = [...this.state.audits];
    try {
      return await work({
        transactionBoundary: 'UNIT_OF_WORK',
        otecAccreditationRepository: {} as never,
        qualityCertificationRepository: {} as never,
        otecOfficeRepository: {} as never,
        legalRepresentativeRepository: this.state.repository,
        otecResolutionRepository: {} as never,
        otecProfileRepository: this.state.profileRepository,
        documentOwnership: this.state.documentOwnership,
        auditLogger: {
          record: async (input) => {
            if (this.state.failAudit) throw new Error('Audit failed');
            this.state.audits.push(input);
          },
        },
      });
    } catch (error) {
      this.state.representatives.splice(
        0,
        this.state.representatives.length,
        ...before.map(LegalRepresentative.rehydrate),
      );
      this.state.audits.splice(0, this.state.audits.length, ...audits);
      throw error;
    }
  }
}
class InMemoryRepresentativeRepository implements LegalRepresentativeRepository {
  constructor(
    private readonly records: LegalRepresentative[],
    private readonly state?: State,
  ) {}
  async findById(organizationId: string, id: string) {
    return (
      this.records.find((x) => {
        const p = x.toPrimitives();
        return p.organizationId === organizationId && p.id === id && !p.deletedAt;
      }) ?? null
    );
  }
  async search(
    organizationId: string,
    filters: LegalRepresentativeFilters,
    pagination: { page: number; pageSize: number },
  ) {
    const data = this.records
      .filter((x) => {
        const p = x.toPrimitives();
        return (
          p.organizationId === organizationId &&
          !p.deletedAt &&
          (!filters.status || p.active === (filters.status === 'ACTIVE')) &&
          (!filters.validAt ||
            ((!p.validFrom || p.validFrom <= filters.validAt) &&
              (!p.validUntil || p.validUntil >= filters.validAt))) &&
          (!filters.validUntilBefore ||
            (!!p.validUntil && p.validUntil <= filters.validUntilBefore))
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
  async save(entity: LegalRepresentative) {
    this.records.push(entity);
  }
  async update(_entity: LegalRepresentative, expectedVersion: number) {
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
      this.records.find((x) => {
        const p = x.toPrimitives();
        return p.organizationId === organizationId && p.id === id && !p.deletedAt;
      }) ?? null
    );
  }
  async search(
    _o: string,
    _f: OtecProfileSearchFilters,
    pagination: { page: number; pageSize: number },
  ) {
    return { data: [], meta: { ...pagination, total: 0, totalPages: 0 } };
  }
  async save() {
    return undefined;
  }
  async update() {
    return undefined;
  }
}
function createInput(otecProfileId: string) {
  return {
    otecProfileId,
    firstName: 'Test',
    lastName: 'Person',
    taxId: '12.345.678-5',
    email: 'Person@Example.Test',
    phone: '+56912345678',
    roleTitle: 'Legal Representative',
    validFrom,
    validUntil,
  };
}
function representative(
  profileId: string,
  overrides: Partial<ReturnType<LegalRepresentative['toPrimitives']>> = {},
) {
  const item = LegalRepresentative.create({
    ...createInput(profileId),
    organizationId: overrides.organizationId ?? tenantId,
  });
  return LegalRepresentative.rehydrate({ ...item.toPrimitives(), ...overrides });
}
function effectiveRepresentative(id = 'rep') {
  return { id, status: 'ACTIVE', active: true, validFrom, validUntil };
}
function repCheck(checks: { ruleCode: string }[]) {
  return checks.find((x) => x.ruleCode === 'OTEC-REP-001');
}
function readySnapshot(): OtecReadinessSnapshot {
  return {
    organization: { id: tenantId, type: 'OTEC', status: 'ACTIVE' },
    profile: { id: 'p', status: 'ACTIVE' },
    settings: {
      requireNch2728: false,
      requiredResolutionTypes: [],
      qualifyingOfficeTypes: ['HEADQUARTERS'],
      expirationWarningDays: [30],
      undatedRecordTreatment: 'WARNING',
    },
    accreditations: [{ id: 'a', status: 'ACTIVE', validFrom, validUntil }],
    certifications: [],
    offices: [{ id: 'o', status: 'ACTIVE', validFrom, validUntil, officeType: 'HEADQUARTERS' }],
    representatives: [effectiveRepresentative()],
    resolutions: [],
  };
}
