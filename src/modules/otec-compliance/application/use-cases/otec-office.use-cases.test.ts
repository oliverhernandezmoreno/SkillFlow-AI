import { describe, expect, it } from 'vitest';

import type { AuditLogInput } from '../../../../shared/application/audit-logger.js';
import type { UseCaseContext } from '../../../../shared/application/use-case-context.js';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  ModuleUnavailableError,
  NotFoundError,
} from '../../../../shared/domain/errors.js';
import { OtecOffice } from '../../domain/entities/otec-office.entity.js';
import { OtecProfile } from '../../domain/entities/otec-profile.entity.js';
import type {
  OtecProfileRepository,
  OtecProfileSearchFilters,
} from '../../domain/repositories/otec-profile.repository.js';
import type {
  OtecOfficeFilters,
  OtecOfficeRepository,
} from '../../domain/repositories/otec-regulatory-record.repositories.js';
import {
  OtecReadinessEvaluator,
  type OtecReadinessSnapshot,
} from '../../domain/services/otec-readiness-evaluator.js';
import type {
  OtecComplianceTransactionManager,
  OtecComplianceUnitOfWork,
} from '../ports/otec-compliance-unit-of-work.js';
import { CreateOtecOfficeUseCase } from './create-otec-office.use-case.js';
import { DeactivateOtecOfficeUseCase } from './deactivate-otec-office.use-case.js';
import { GetOtecOfficeUseCase } from './get-otec-office.use-case.js';
import { ListOtecOfficesUseCase } from './list-otec-offices.use-case.js';
import { UpdateOtecOfficeUseCase } from './update-otec-office.use-case.js';

const tenantId = '26000000-0000-4000-8000-000000000001';
const foreignTenantId = '26000000-0000-4000-8000-000000000002';
const context: UseCaseContext = {
  actorUserId: '26000000-0000-4000-8000-000000000003',
  organizationId: tenantId,
  permissions: ['otec_compliance.read', 'otec_compliance.office.manage'],
};
const evaluatedAt = new Date('2026-07-16T00:00:00.000Z');
const validFrom = new Date('2026-01-01T00:00:00.000Z');
const validUntil = new Date('2027-01-01T00:00:00.000Z');
const enabledAccess = {
  evaluate: async () => ({ allowed: true as const, reason: 'ENABLED' as const }),
};
const disabledAccess = {
  evaluate: async () => ({ allowed: false as const, reason: 'DISABLED' as const }),
};
const now = () => evaluatedAt;

describe('OtecOffice use cases', () => {
  it('allows read permission for a query but not for an office command', async () => {
    const profile = OtecProfile.create({ organizationId: tenantId });
    const state = createState([profile]);
    const readOnly = { ...context, permissions: ['otec_compliance.read'] };
    await expect(
      new ListOtecOfficesUseCase(new InMemoryTransactionManager(state), enabledAccess, now).execute(
        {},
        { page: 1, pageSize: 10 },
        readOnly,
      ),
    ).resolves.toMatchObject({ data: [] });
    await expect(
      new CreateOtecOfficeUseCase(
        new InMemoryTransactionManager(state),
        enabledAccess,
        now,
      ).execute(createInput(profile.id), readOnly),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(state.offices).toHaveLength(0);
    expect(state.audits).toHaveLength(0);
  });
  it.each(['HEADQUARTERS', 'BRANCH', 'OPERATING_OFFICE', 'TRAINING_SITE', 'OTHER'] as const)(
    'creates and audits a valid %s office using the context tenant',
    async (officeType) => {
      const profile = OtecProfile.create({ organizationId: tenantId });
      const state = createState([profile]);
      const result = await new CreateOtecOfficeUseCase(
        new InMemoryTransactionManager(state),
        enabledAccess,
        now,
      ).execute(
        {
          ...createInput(profile.id),
          organizationId: foreignTenantId,
          officeType,
          officeCode: ' office-01 ',
        },
        context,
      );
      expect(result).toMatchObject({
        organizationId: tenantId,
        officeType,
        officeCode: 'OFFICE-01',
        status: 'ACTIVE',
        version: 1,
      });
      expect(state.audits.at(-1)).toMatchObject({
        organizationId: tenantId,
        action: 'OTEC_OFFICE_CREATED',
      });
    },
  );

  it('rejects unavailable module before creating data', async () => {
    const profile = OtecProfile.create({ organizationId: tenantId });
    const state = createState([profile]);
    await expect(
      new CreateOtecOfficeUseCase(
        new InMemoryTransactionManager(state),
        disabledAccess,
        now,
      ).execute(createInput(profile.id), context),
    ).rejects.toBeInstanceOf(ModuleUnavailableError);
    expect(state.offices).toHaveLength(0);
  });

  it('rejects missing, inactive, and foreign profiles', async () => {
    const active = OtecProfile.create({ organizationId: tenantId });
    const inactive = OtecProfile.rehydrate({
      ...OtecProfile.create({ organizationId: tenantId }).toPrimitives(),
      registrationStatus: 'INACTIVE',
    });
    const foreign = OtecProfile.create({ organizationId: foreignTenantId });
    const useCase = new CreateOtecOfficeUseCase(
      new InMemoryTransactionManager(createState([active, inactive, foreign])),
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

  it('rejects invalid dates, required fields, type, and duplicate without partial writes', async () => {
    const profile = OtecProfile.create({ organizationId: tenantId });
    const duplicate = office(profile.id, { officeCode: 'DUP' });
    const state = createState([profile], [duplicate]);
    const useCase = new CreateOtecOfficeUseCase(
      new InMemoryTransactionManager(state),
      enabledAccess,
      now,
    );
    await expect(
      useCase.execute(
        { ...createInput(profile.id), validFrom: validUntil, validUntil: validFrom },
        context,
      ),
    ).rejects.toBeInstanceOf(BadRequestError);
    await expect(
      useCase.execute({ ...createInput(profile.id), name: '  ' }, context),
    ).rejects.toBeInstanceOf(BadRequestError);
    await expect(
      useCase.execute({ ...createInput(profile.id), officeType: 'INVALID' }, context),
    ).rejects.toBeInstanceOf(BadRequestError);
    await expect(
      useCase.execute({ ...createInput(profile.id), officeCode: 'dup' }, context),
    ).rejects.toBeInstanceOf(ConflictError);
    expect(state.offices).toHaveLength(1);
    expect(state.audits).toHaveLength(0);
  });

  it('rolls back creation when audit persistence fails', async () => {
    const profile = OtecProfile.create({ organizationId: tenantId });
    const state = createState([profile]);
    state.failAudit = true;
    await expect(
      new CreateOtecOfficeUseCase(
        new InMemoryTransactionManager(state),
        enabledAccess,
        now,
      ).execute(createInput(profile.id), context),
    ).rejects.toThrow('Audit failed');
    expect(state.offices).toHaveLength(0);
  });

  it('lists tenant offices with approved filters, deterministic pagination, and empty results', async () => {
    const records = [
      office('p', { officeCode: 'CURRENT-A', createdAt: new Date('2026-01-01') }),
      office('p', { officeCode: 'CURRENT-B', createdAt: new Date('2026-02-01') }),
      office('p', { officeCode: 'UPCOMING', validUntil: new Date('2026-07-25') }),
      office('p', {
        officeCode: 'EXPIRED',
        validFrom: new Date('2025-01-01'),
        validUntil: new Date('2025-12-31'),
      }),
      office('p', { officeCode: 'BRANCH', officeType: 'BRANCH' }),
      office('p', { officeCode: 'INACTIVE', status: 'INACTIVE' }),
      office('p', { officeCode: 'DELETED', deletedAt: evaluatedAt }),
      office('p', { organizationId: foreignTenantId, officeCode: 'FOREIGN' }),
    ];
    const state = createState([], records);
    const useCase = new ListOtecOfficesUseCase(
      new InMemoryTransactionManager(state),
      enabledAccess,
      now,
    );
    const page = await useCase.execute(
      { officeType: 'HEADQUARTERS', status: 'ACTIVE', validAt: evaluatedAt },
      { page: 1, pageSize: 2 },
      context,
    );
    expect(page.meta).toMatchObject({ total: 3, totalPages: 2 });
    expect(page.data.map((item) => item.officeCode)).toEqual(['UPCOMING', 'CURRENT-B']);
    expect(
      (await useCase.execute({ status: 'INACTIVE' }, { page: 1, pageSize: 10 }, context)).data,
    ).toHaveLength(1);
    expect(
      (
        await useCase.execute({ validUntilBefore: evaluatedAt }, { page: 1, pageSize: 10 }, context)
      ).data.map((x) => x.officeCode),
    ).toEqual(['EXPIRED']);
    expect(
      (
        await useCase.execute(
          { validUntilFrom: evaluatedAt, validUntilBefore: new Date('2026-07-31') },
          { page: 1, pageSize: 10 },
          context,
        )
      ).data.map((x) => x.officeCode),
    ).toEqual(['UPCOMING']);
    await expect(
      useCase.execute(
        { organizationId: foreignTenantId } as OtecOfficeFilters,
        { page: 1, pageSize: 10 },
        { ...context, organizationId: 'empty' },
      ),
    ).resolves.toMatchObject({ data: [] });
  });

  it('gets only a tenant-owned, non-deleted office', async () => {
    const own = office('p');
    const foreign = office('p', { organizationId: foreignTenantId });
    const deleted = office('p', { deletedAt: evaluatedAt });
    const useCase = new GetOtecOfficeUseCase(
      new InMemoryTransactionManager(createState([], [own, foreign, deleted])),
      enabledAccess,
      now,
    );
    await expect(useCase.execute(own.id, context)).resolves.toMatchObject({ id: own.id });
    await expect(useCase.execute(foreign.id, context)).rejects.toBeInstanceOf(NotFoundError);
    await expect(useCase.execute(deleted.id, context)).rejects.toBeInstanceOf(NotFoundError);
    await expect(useCase.execute('missing', context)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('updates with expectedVersion, increments version, and audits before/after', async () => {
    const record = office('p');
    const state = createState([], [record]);
    const result = await new UpdateOtecOfficeUseCase(
      new InMemoryTransactionManager(state),
      enabledAccess,
      now,
    ).execute(record.id, { expectedVersion: 1, name: ' Updated office ', validUntil }, context);
    expect(result).toMatchObject({ name: 'Updated office', version: 2 });
    expect(state.lastExpectedVersion).toBe(1);
    const audit = state.audits.at(-1);
    expect(audit).toMatchObject({ action: 'OTEC_OFFICE_UPDATED' });
    expect(audit?.before).toBeDefined();
    expect(audit?.after).toBeDefined();
  });

  it('rejects stale, invalid, scope-changing, and cross-tenant updates without mutation', async () => {
    const record = office('p', { notes: 'Before' });
    const foreign = office('p', { organizationId: foreignTenantId });
    const state = createState([], [record, foreign]);
    const useCase = new UpdateOtecOfficeUseCase(
      new InMemoryTransactionManager(state),
      enabledAccess,
      now,
    );
    state.conflictOnUpdate = true;
    await expect(
      useCase.execute(record.id, { expectedVersion: 0, notes: 'Stale' }, context),
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
      useCase.execute(foreign.id, { expectedVersion: 1, notes: 'No' }, context),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(state.offices[0]?.toPrimitives().notes).toBe('Before');
  });

  it('rolls back update when audit persistence fails', async () => {
    const record = office('p', { name: 'Before' });
    const state = createState([], [record]);
    state.failAudit = true;
    await expect(
      new UpdateOtecOfficeUseCase(
        new InMemoryTransactionManager(state),
        enabledAccess,
        now,
      ).execute(record.id, { expectedVersion: 1, name: 'After' }, context),
    ).rejects.toThrow('Audit failed');
    expect(state.offices[0]?.toPrimitives()).toMatchObject({ name: 'Before', version: 1 });
  });

  it('soft-deactivates once with concurrency and audit, rejects cross-tenant, and rolls back audit failure', async () => {
    const own = office('p');
    const foreign = office('p', { organizationId: foreignTenantId });
    const state = createState([], [own, foreign]);
    const useCase = new DeactivateOtecOfficeUseCase(
      new InMemoryTransactionManager(state),
      enabledAccess,
      now,
    );
    const result = await useCase.execute(own.id, { expectedVersion: 1 }, context);
    expect(result).toMatchObject({ status: 'INACTIVE', version: 2 });
    expect(result.deletedAt).toEqual(evaluatedAt);
    expect(state.offices).toHaveLength(2);
    await expect(useCase.execute(own.id, { expectedVersion: 2 }, context)).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await expect(
      useCase.execute(foreign.id, { expectedVersion: 1 }, context),
    ).rejects.toBeInstanceOf(NotFoundError);
    const stale = office('p');
    const staleState = createState([], [stale]);
    staleState.conflictOnUpdate = true;
    await expect(
      new DeactivateOtecOfficeUseCase(
        new InMemoryTransactionManager(staleState),
        enabledAccess,
        now,
      ).execute(stale.id, { expectedVersion: 0 }, context),
    ).rejects.toBeInstanceOf(ConflictError);
    const rollback = office('p');
    const rollbackState = createState([], [rollback]);
    rollbackState.failAudit = true;
    await expect(
      new DeactivateOtecOfficeUseCase(
        new InMemoryTransactionManager(rollbackState),
        enabledAccess,
        now,
      ).execute(rollback.id, { expectedVersion: 1 }, context),
    ).rejects.toThrow('Audit failed');
    expect(rollbackState.offices[0]?.toPrimitives()).toMatchObject({
      status: 'ACTIVE',
      deletedAt: null,
      version: 1,
    });
  });

  it('evaluates OTEC-OFF-001 for current, inactive, future, expired, historical, multiple, and deactivated offices', () => {
    const evaluator = new OtecReadinessEvaluator();
    const snapshot = readySnapshot();
    expect(officeCheck(evaluator.evaluate(snapshot, evaluatedAt).blockingIssues)).toBeUndefined();
    snapshot.offices = [{ ...effectiveOffice(), status: 'INACTIVE' }];
    expect(officeCheck(evaluator.evaluate(snapshot, evaluatedAt).blockingIssues)).toBeDefined();
    snapshot.offices = [{ ...effectiveOffice(), validFrom: new Date('2026-08-01') }];
    expect(officeCheck(evaluator.evaluate(snapshot, evaluatedAt).blockingIssues)).toBeDefined();
    snapshot.offices = [{ ...effectiveOffice(), validUntil: new Date('2026-07-15') }];
    expect(officeCheck(evaluator.evaluate(snapshot, evaluatedAt).blockingIssues)).toBeDefined();
    expect(
      officeCheck(evaluator.evaluate(snapshot, new Date('2026-07-01')).blockingIssues),
    ).toBeUndefined();
    snapshot.offices = [effectiveOffice(), effectiveOffice('second')];
    expect(officeCheck(evaluator.evaluate(snapshot, evaluatedAt).blockingIssues)).toBeUndefined();
    snapshot.offices = [];
    expect(evaluator.evaluate(snapshot, evaluatedAt).status).toBe('NOT_READY');
  });

  it('does not count soft-deleted, foreign, or non-qualifying offices in an authorized readiness snapshot', async () => {
    const records = [
      office('p', { deletedAt: evaluatedAt }),
      office('p', { organizationId: foreignTenantId }),
      office('p', { officeType: 'OTHER' }),
    ];
    const listed = await new ListOtecOfficesUseCase(
      new InMemoryTransactionManager(createState([], records)),
      enabledAccess,
      now,
    ).execute({ status: 'ACTIVE', validAt: evaluatedAt }, { page: 1, pageSize: 10 }, context);
    const snapshot = readySnapshot();
    snapshot.offices = listed.data.map((x) => ({
      id: x.id,
      status: x.status,
      validFrom: x.validFrom,
      validUntil: x.validUntil,
      officeType: x.officeType,
    }));
    expect(
      officeCheck(new OtecReadinessEvaluator().evaluate(snapshot, evaluatedAt).blockingIssues),
    ).toBeDefined();
  });
});

interface State {
  profiles: OtecProfile[];
  offices: OtecOffice[];
  audits: AuditLogInput[];
  failAudit: boolean;
  conflictOnUpdate: boolean;
  lastExpectedVersion: number | null;
  officeRepository: InMemoryOfficeRepository;
  profileRepository: InMemoryProfileRepository;
}
function createState(profiles: OtecProfile[] = [], offices: OtecOffice[] = []): State {
  const state = {
    profiles,
    offices,
    audits: [],
    failAudit: false,
    conflictOnUpdate: false,
    lastExpectedVersion: null,
  } as unknown as State;
  state.officeRepository = new InMemoryOfficeRepository(offices, state);
  state.profileRepository = new InMemoryProfileRepository(profiles);
  return state;
}
class InMemoryTransactionManager implements OtecComplianceTransactionManager {
  constructor(private readonly state: State) {}
  async run<TResult>(work: (uow: OtecComplianceUnitOfWork) => Promise<TResult>): Promise<TResult> {
    const before = this.state.offices.map((x) => x.toPrimitives());
    const audits = [...this.state.audits];
    try {
      return await work({
        transactionBoundary: 'UNIT_OF_WORK',
        otecAccreditationRepository: {} as never,
        qualityCertificationRepository: {} as never,
        otecOfficeRepository: this.state.officeRepository,
        legalRepresentativeRepository: {} as never,
        otecResolutionRepository: {} as never,
        otecProfileRepository: this.state.profileRepository,
        documentOwnership: {} as never,
        auditLogger: {
          record: async (input) => {
            if (this.state.failAudit) throw new Error('Audit failed');
            this.state.audits.push(input);
          },
        },
      });
    } catch (error) {
      this.state.offices.splice(0, this.state.offices.length, ...before.map(OtecOffice.rehydrate));
      this.state.audits.splice(0, this.state.audits.length, ...audits);
      throw error;
    }
  }
}
class InMemoryOfficeRepository implements OtecOfficeRepository {
  constructor(
    private readonly records: OtecOffice[],
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
    filters: OtecOfficeFilters,
    pagination: { page: number; pageSize: number },
  ) {
    const data = this.records
      .filter((x) => {
        const p = x.toPrimitives();
        return (
          p.organizationId === organizationId &&
          !p.deletedAt &&
          (!filters.officeType || p.officeType === filters.officeType) &&
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
  async save(entity: OtecOffice) {
    const p = entity.toPrimitives();
    if (
      this.records.some((x) => {
        const e = x.toPrimitives();
        return (
          e.organizationId === p.organizationId &&
          e.otecProfileId === p.otecProfileId &&
          e.officeCode === p.officeCode &&
          e.status === 'ACTIVE' &&
          !e.deletedAt
        );
      })
    )
      throw new ConflictError('Duplicate');
    this.records.push(entity);
  }
  async update(_entity: OtecOffice, expectedVersion: number) {
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
    officeCode: 'OFFICE-NEW',
    name: 'Main Office',
    officeType: 'HEADQUARTERS' as const,
    street: 'Test Street 1',
    city: 'Santiago',
    commune: 'Santiago',
    region: 'Metropolitana',
    country: 'CL',
    validFrom,
    validUntil,
  };
}
function office(
  profileId: string,
  overrides: Partial<ReturnType<OtecOffice['toPrimitives']>> = {},
) {
  const item = OtecOffice.create({
    ...createInput(profileId),
    organizationId: overrides.organizationId ?? tenantId,
    officeCode: overrides.officeCode ?? `OFF-${Math.random().toString()}`,
    officeType: overrides.officeType ?? 'HEADQUARTERS',
  });
  return OtecOffice.rehydrate({ ...item.toPrimitives(), ...overrides });
}
function effectiveOffice(id = 'office') {
  return { id, status: 'ACTIVE', validFrom, validUntil, officeType: 'HEADQUARTERS' };
}
function officeCheck(checks: { ruleCode: string }[]) {
  return checks.find((x) => x.ruleCode === 'OTEC-OFF-001');
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
    offices: [effectiveOffice()],
    representatives: [{ id: 'r', status: 'ACTIVE', validFrom, validUntil, active: true }],
    resolutions: [],
  };
}
