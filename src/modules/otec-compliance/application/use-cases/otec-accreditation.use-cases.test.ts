import { describe, expect, it } from 'vitest';

import type { AuditLogInput, AuditLogger } from '../../../../shared/application/audit-logger.js';
import type { UseCaseContext } from '../../../../shared/application/use-case-context.js';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  ModuleUnavailableError,
  NotFoundError,
} from '../../../../shared/domain/errors.js';
import { OtecAccreditation } from '../../domain/entities/otec-accreditation.entity.js';
import { OtecProfile } from '../../domain/entities/otec-profile.entity.js';
import type {
  OtecProfileRepository,
  OtecProfileSearchFilters,
} from '../../domain/repositories/otec-profile.repository.js';
import type {
  EffectiveRecordFilters,
  OtecAccreditationRepository,
} from '../../domain/repositories/otec-regulatory-record.repositories.js';
import type {
  OtecComplianceTransactionManager,
  OtecComplianceUnitOfWork,
} from '../ports/otec-compliance-unit-of-work.js';
import { CreateOtecAccreditationUseCase as AuthorizedCreate } from './create-otec-accreditation.use-case.js';
import { GetOtecAccreditationUseCase as AuthorizedGet } from './get-otec-accreditation.use-case.js';
import { ListOtecAccreditationsUseCase as AuthorizedList } from './list-otec-accreditations.use-case.js';
import { RevokeOtecAccreditationUseCase as AuthorizedRevoke } from './revoke-otec-accreditation.use-case.js';
import { SuspendOtecAccreditationUseCase as AuthorizedSuspend } from './suspend-otec-accreditation.use-case.js';
import { UpdateOtecAccreditationUseCase as AuthorizedUpdate } from './update-otec-accreditation.use-case.js';

const tenantId = '24000000-0000-4000-8000-000000000001';
const foreignTenantId = '24000000-0000-4000-8000-000000000002';
const context: UseCaseContext = {
  actorUserId: '24000000-0000-4000-8000-000000000003',
  organizationId: tenantId,
  permissions: ['otec_compliance.read', 'otec_compliance.accreditation.manage'],
};
const validFrom = new Date('2026-01-01T00:00:00.000Z');
const validUntil = new Date('2026-12-31T00:00:00.000Z');
const enabled = { evaluate: async () => ({ allowed: true as const, reason: 'ENABLED' as const }) };
class CreateOtecAccreditationUseCase extends AuthorizedCreate {
  constructor(tx: OtecComplianceTransactionManager) {
    super(tx, enabled);
  }
}
class GetOtecAccreditationUseCase extends AuthorizedGet {
  constructor(repo: OtecAccreditationRepository) {
    super(repo, enabled);
  }
}
class ListOtecAccreditationsUseCase extends AuthorizedList {
  constructor(repo: OtecAccreditationRepository) {
    super(repo, enabled);
  }
}
class RevokeOtecAccreditationUseCase extends AuthorizedRevoke {
  constructor(tx: OtecComplianceTransactionManager) {
    super(tx, enabled);
  }
}
class SuspendOtecAccreditationUseCase extends AuthorizedSuspend {
  constructor(tx: OtecComplianceTransactionManager) {
    super(tx, enabled);
  }
}
class UpdateOtecAccreditationUseCase extends AuthorizedUpdate {
  constructor(tx: OtecComplianceTransactionManager) {
    super(tx, enabled);
  }
}

describe('OTEC accreditation use cases', () => {
  it('rejects an unavailable accreditation entitlement before persistence', async () => {
    const profile = OtecProfile.create({ organizationId: tenantId });
    const state = createState([profile]);
    const disabled = {
      evaluate: async () => ({ allowed: false as const, reason: 'DISABLED' as const }),
    };
    await expect(
      new AuthorizedCreate(new InMemoryTransactionManager(state), disabled).execute(
        validCreateInput(profile.id),
        context,
      ),
    ).rejects.toBeInstanceOf(ModuleUnavailableError);
    expect(state.accreditations).toHaveLength(0);
    expect(state.audits).toHaveLength(0);
  });
  it('creates for an active same-tenant profile, forces context tenant, and audits atomically', async () => {
    const profile = OtecProfile.create({ organizationId: tenantId });
    const state = createState([profile]);
    const useCase = new CreateOtecAccreditationUseCase(new InMemoryTransactionManager(state));

    const result = await useCase.execute(
      {
        organizationId: foreignTenantId,
        otecProfileId: profile.id,
        accreditationType: 'INTERNAL_TEST',
        accreditationNumber: 'ACC-001',
        validFrom,
        validUntil,
      },
      context,
    );

    expect(result).toMatchObject({
      organizationId: tenantId,
      otecProfileId: profile.id,
      status: 'ACTIVE',
      version: 1,
    });
    expect(state.accreditations).toHaveLength(1);
    expect(state.audits.at(-1)).toMatchObject({
      action: 'OTEC_ACCREDITATION_CREATED',
      organizationId: tenantId,
    });
  });

  it.each([
    ['missing profile', null, 'missing-profile'],
    ['foreign profile', foreignTenantId, 'foreign-profile'],
  ])('rejects %s and persists nothing', async (_label, profileTenantId, profileId) => {
    const profiles =
      profileTenantId === null
        ? []
        : [
            OtecProfile.rehydrate({
              ...OtecProfile.create({ organizationId: profileTenantId }).toPrimitives(),
              id: profileId,
            }),
          ];
    const state = createState(profiles);
    const useCase = new CreateOtecAccreditationUseCase(new InMemoryTransactionManager(state));
    await expect(useCase.execute(validCreateInput(profileId), context)).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect(state.accreditations).toHaveLength(0);
    expect(state.audits).toHaveLength(0);
  });

  it('rejects invalid dates, unsupported initial state, and an active duplicate without persistence', async () => {
    const profile = OtecProfile.create({ organizationId: tenantId });
    const duplicate = accreditation(profile.id, { accreditationNumber: 'DUPLICATE' });
    const state = createState([profile], [duplicate]);
    const useCase = new CreateOtecAccreditationUseCase(new InMemoryTransactionManager(state));

    await expect(
      useCase.execute(
        { ...validCreateInput(profile.id), validFrom: validUntil, validUntil: validFrom },
        context,
      ),
    ).rejects.toBeInstanceOf(BadRequestError);
    await expect(
      useCase.execute({ ...validCreateInput(profile.id), status: 'SUSPENDED' }, context),
    ).rejects.toBeInstanceOf(BadRequestError);
    await expect(
      useCase.execute(
        { ...validCreateInput(profile.id), accreditationNumber: 'DUPLICATE' },
        context,
      ),
    ).rejects.toBeInstanceOf(ConflictError);
    expect(state.accreditations).toHaveLength(1);
    expect(state.audits).toHaveLength(0);
  });

  it('rolls back creation when audit persistence fails', async () => {
    const profile = OtecProfile.create({ organizationId: tenantId });
    const state = createState([profile]);
    state.failAudit = true;
    const useCase = new CreateOtecAccreditationUseCase(new InMemoryTransactionManager(state));
    await expect(useCase.execute(validCreateInput(profile.id), context)).rejects.toThrow(
      'Audit failed',
    );
    expect(state.accreditations).toHaveLength(0);
  });

  it('lists only same-tenant non-deleted records with status, validity, expiry, pagination, and stable order', async () => {
    const records = [
      accreditation('profile', { accreditationNumber: 'A', createdAt: new Date('2026-01-01') }),
      accreditation('profile', { accreditationNumber: 'B', createdAt: new Date('2026-02-01') }),
      accreditation('profile', {
        accreditationNumber: 'EXPIRED',
        validFrom: new Date('2025-01-01'),
        validUntil: new Date('2025-12-31'),
      }),
      accreditation('foreign', { organizationId: foreignTenantId, accreditationNumber: 'FOREIGN' }),
      accreditation('profile', { accreditationNumber: 'DELETED', deletedAt: new Date() }),
    ];
    const repository = new InMemoryAccreditationRepository(records);
    const useCase = new ListOtecAccreditationsUseCase(repository);

    const active = await useCase.execute(
      { status: 'ACTIVE', validAt: new Date('2026-06-01') },
      { page: 1, pageSize: 1 },
      context,
    );
    expect(active.data).toHaveLength(1);
    expect(active.meta).toMatchObject({ total: 2, totalPages: 2 });
    expect(active.data[0]?.accreditationNumber).toBe('B');
    const expired = await useCase.execute(
      { validUntilBefore: new Date('2026-01-01') },
      { page: 1, pageSize: 10 },
      context,
    );
    expect(expired.data.map((item) => item.accreditationNumber)).toEqual(['EXPIRED']);
    const empty = await useCase.execute(
      {},
      { page: 1, pageSize: 10 },
      { ...context, organizationId: 'empty' },
    );
    expect(empty.data).toEqual([]);
  });

  it('gets only own non-deleted accreditation and hides foreign, deleted, and missing IDs', async () => {
    const own = accreditation('profile');
    const foreign = accreditation('foreign', { organizationId: foreignTenantId });
    const deleted = accreditation('profile', { deletedAt: new Date() });
    const useCase = new GetOtecAccreditationUseCase(
      new InMemoryAccreditationRepository([own, foreign, deleted]),
    );
    await expect(useCase.execute(own.id, context)).resolves.toMatchObject({ id: own.id });
    await expect(useCase.execute(foreign.id, context)).rejects.toBeInstanceOf(NotFoundError);
    await expect(useCase.execute(deleted.id, context)).rejects.toBeInstanceOf(NotFoundError);
    await expect(useCase.execute('missing', context)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('updates allowed fields with expectedVersion, increments version, and audits before/after', async () => {
    const record = accreditation('profile');
    const state = createState([], [record]);
    const useCase = new UpdateOtecAccreditationUseCase(new InMemoryTransactionManager(state));
    const result = await useCase.execute(
      record.id,
      { expectedVersion: 1, notes: 'Updated', validUntil: new Date('2027-01-01') },
      context,
    );
    expect(result).toMatchObject({ notes: 'Updated', version: 2 });
    expect(state.lastExpectedVersion).toBe(1);
    expect(state.audits.at(-1)?.action).toBe('OTEC_ACCREDITATION_UPDATED');
    expect(state.audits.at(-1)?.before).toBeDefined();
    expect(state.audits.at(-1)?.after).toBeDefined();
  });

  it('rejects stale version, invalid dates, tenant/profile reassignment, and revoked updates', async () => {
    const record = accreditation('profile');
    const state = createState([], [record]);
    const useCase = new UpdateOtecAccreditationUseCase(new InMemoryTransactionManager(state));
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
      useCase.execute(record.id, { expectedVersion: 1, otecProfileId: 'replacement' }, context),
    ).rejects.toBeInstanceOf(BadRequestError);
    record.revoke();
    await expect(
      useCase.execute(record.id, { expectedVersion: 2, notes: 'Forbidden' }, context),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('suspends ACTIVE once with expectedVersion, reason metadata, and audit', async () => {
    const record = accreditation('profile');
    const state = createState([], [record]);
    const useCase = new SuspendOtecAccreditationUseCase(new InMemoryTransactionManager(state));
    const result = await useCase.execute(
      record.id,
      { expectedVersion: 1, reason: 'Internal review' },
      context,
    );
    expect(result).toMatchObject({ status: 'SUSPENDED', version: 2 });
    expect(state.audits.at(-1)).toMatchObject({
      action: 'OTEC_ACCREDITATION_SUSPENDED',
      metadata: { reason: 'Internal review' },
    });
    await expect(
      useCase.execute(record.id, { expectedVersion: 2 }, context),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it.each(['REVOKED', 'CANCELLED', 'SUSPENDED'] as const)(
    'rejects suspension from %s',
    async (status) => {
      const record = accreditation('profile', { status });
      const useCase = new SuspendOtecAccreditationUseCase(
        new InMemoryTransactionManager(createState([], [record])),
      );
      await expect(
        useCase.execute(record.id, { expectedVersion: 1 }, context),
      ).rejects.toBeInstanceOf(ConflictError);
    },
  );

  it('rejects suspension of an expired active accreditation', async () => {
    const record = accreditation('profile', {
      validFrom: new Date('2024-01-01T00:00:00.000Z'),
      validUntil: new Date('2024-12-31T00:00:00.000Z'),
    });
    const useCase = new SuspendOtecAccreditationUseCase(
      new InMemoryTransactionManager(createState([], [record])),
    );
    await expect(
      useCase.execute(record.id, { expectedVersion: 1 }, context),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('revokes ACTIVE or SUSPENDED once, audits, and prevents later update/reactivation', async () => {
    for (const status of ['ACTIVE', 'SUSPENDED'] as const) {
      const record = accreditation('profile', { status });
      const state = createState([], [record]);
      const revoke = new RevokeOtecAccreditationUseCase(new InMemoryTransactionManager(state));
      await expect(
        revoke.execute(record.id, { expectedVersion: 1, reason: 'Decision' }, context),
      ).resolves.toMatchObject({ status: 'REVOKED', version: 2 });
      expect(state.audits.at(-1)).toMatchObject({ action: 'OTEC_ACCREDITATION_REVOKED' });
      await expect(
        revoke.execute(record.id, { expectedVersion: 2 }, context),
      ).rejects.toBeInstanceOf(ConflictError);
    }
  });

  it('rejects transition cross-tenant and propagates concurrency conflicts without audit', async () => {
    const foreign = accreditation('profile', { organizationId: foreignTenantId });
    const own = accreditation('profile');
    const state = createState([], [foreign, own]);
    const suspend = new SuspendOtecAccreditationUseCase(new InMemoryTransactionManager(state));
    const revoke = new RevokeOtecAccreditationUseCase(new InMemoryTransactionManager(state));
    await expect(
      suspend.execute(foreign.id, { expectedVersion: 1 }, context),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      revoke.execute(foreign.id, { expectedVersion: 1 }, context),
    ).rejects.toBeInstanceOf(NotFoundError);
    state.conflictOnUpdate = true;
    await expect(suspend.execute(own.id, { expectedVersion: 0 }, context)).rejects.toBeInstanceOf(
      ConflictError,
    );
    await expect(revoke.execute(own.id, { expectedVersion: 0 }, context)).rejects.toBeInstanceOf(
      ConflictError,
    );
    expect(state.audits).toHaveLength(0);
  });

  it('rejects revocation from CANCELLED', async () => {
    const record = accreditation('profile', { status: 'CANCELLED' });
    const useCase = new RevokeOtecAccreditationUseCase(
      new InMemoryTransactionManager(createState([], [record])),
    );
    await expect(
      useCase.execute(record.id, { expectedVersion: 1 }, context),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('requires authenticated tenant context for every use case', async () => {
    const state = createState();
    const anonymous = { ...context, organizationId: null };
    await expect(
      new CreateOtecAccreditationUseCase(new InMemoryTransactionManager(state)).execute(
        validCreateInput('profile'),
        anonymous,
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(
      new ListOtecAccreditationsUseCase(state.repository).execute(
        {},
        { page: 1, pageSize: 10 },
        anonymous,
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(
      new GetOtecAccreditationUseCase(state.repository).execute('id', anonymous),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});

interface State {
  profiles: OtecProfile[];
  accreditations: OtecAccreditation[];
  audits: AuditLogInput[];
  repository: InMemoryAccreditationRepository;
  profileRepository: InMemoryProfileRepository;
  failAudit: boolean;
  conflictOnUpdate: boolean;
  lastExpectedVersion: number | null;
}

function createState(
  profiles: OtecProfile[] = [],
  accreditations: OtecAccreditation[] = [],
): State {
  const state = {
    profiles,
    accreditations,
    audits: [],
    failAudit: false,
    conflictOnUpdate: false,
    lastExpectedVersion: null,
  } as unknown as State;
  state.repository = new InMemoryAccreditationRepository(state.accreditations, state);
  state.profileRepository = new InMemoryProfileRepository(state.profiles);
  return state;
}

class InMemoryTransactionManager implements OtecComplianceTransactionManager {
  constructor(private readonly state: State) {}
  async run<TResult>(
    work: (unitOfWork: OtecComplianceUnitOfWork) => Promise<TResult>,
  ): Promise<TResult> {
    const accreditationSnapshot = [...this.state.accreditations];
    const auditSnapshot = [...this.state.audits];
    try {
      return await work({
        transactionBoundary: 'UNIT_OF_WORK',
        otecAccreditationRepository: this.state.repository,
        otecOfficeRepository: {} as never,
        legalRepresentativeRepository: {} as never,
        otecResolutionRepository: {} as never,
        otecProfileRepository: this.state.profileRepository,
        qualityCertificationRepository: {} as never,
        documentOwnership: { belongsToTenant: async () => false },
        auditLogger: new StateAuditLogger(this.state),
      });
    } catch (error) {
      this.state.accreditations.splice(
        0,
        this.state.accreditations.length,
        ...accreditationSnapshot,
      );
      this.state.audits.splice(0, this.state.audits.length, ...auditSnapshot);
      throw error;
    }
  }
}

class StateAuditLogger implements AuditLogger {
  constructor(private readonly state: State) {}
  async record(input: AuditLogInput): Promise<void> {
    if (this.state.failAudit) throw new Error('Audit failed');
    this.state.audits.push(input);
  }
}

class InMemoryAccreditationRepository implements OtecAccreditationRepository {
  constructor(
    private readonly records: OtecAccreditation[],
    private readonly state?: State,
  ) {}
  async findById(organizationId: string, id: string) {
    return (
      this.records.find((record) => {
        const props = record.toPrimitives();
        return (
          props.organizationId === organizationId && props.id === id && props.deletedAt === null
        );
      }) ?? null
    );
  }
  async search(
    organizationId: string,
    filters: EffectiveRecordFilters<'DRAFT' | 'ACTIVE' | 'SUSPENDED' | 'REVOKED' | 'CANCELLED'>,
    pagination: { page: number; pageSize: number },
  ) {
    const filtered = this.records
      .filter((record) => {
        const props = record.toPrimitives();
        return (
          props.organizationId === organizationId &&
          props.deletedAt === null &&
          (!filters.status || props.status === filters.status) &&
          (!filters.validAt ||
            ((!props.validFrom || props.validFrom <= filters.validAt) &&
              (!props.validUntil || props.validUntil >= filters.validAt))) &&
          (!filters.validUntilBefore ||
            (!!props.validUntil && props.validUntil <= filters.validUntilBefore))
        );
      })
      .sort(
        (left, right) =>
          right.toPrimitives().createdAt.getTime() - left.toPrimitives().createdAt.getTime() ||
          left.id.localeCompare(right.id),
      );
    const start = (pagination.page - 1) * pagination.pageSize;
    return {
      data: filtered.slice(start, start + pagination.pageSize),
      meta: {
        ...pagination,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / pagination.pageSize),
      },
    };
  }
  async save(entity: OtecAccreditation) {
    if (
      this.records.some((record) => {
        const existing = record.toPrimitives();
        const candidate = entity.toPrimitives();
        return (
          existing.organizationId === candidate.organizationId &&
          existing.otecProfileId === candidate.otecProfileId &&
          existing.accreditationNumber === candidate.accreditationNumber &&
          existing.status === 'ACTIVE' &&
          existing.deletedAt === null
        );
      })
    )
      throw new ConflictError('Duplicate');
    this.records.push(entity);
  }
  async update(_entity: OtecAccreditation, expectedVersion: number) {
    if (this.state) {
      this.state.lastExpectedVersion = expectedVersion;
      if (this.state.conflictOnUpdate) throw new ConflictError('Stale');
    }
  }
}

class InMemoryProfileRepository implements OtecProfileRepository {
  constructor(private readonly profiles: OtecProfile[]) {}
  async findCurrentByOrganizationId(organizationId: string) {
    return (
      this.profiles.find((profile) => {
        const props = profile.toPrimitives();
        return props.organizationId === organizationId && props.registrationStatus === 'ACTIVE' && props.deletedAt === null;
      }) ?? null
    );
  }
  async findById(organizationId: string, id: string) {
    return (
      this.profiles.find((profile) => {
        const props = profile.toPrimitives();
        return (
          props.organizationId === organizationId && props.id === id && props.deletedAt === null
        );
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
  async save(profile: OtecProfile) {
    this.profiles.push(profile);
  }
  async update(): Promise<void> {
    return undefined;
  }
}

function accreditation(
  profileId: string,
  overrides: Partial<ReturnType<OtecAccreditation['toPrimitives']>> = {},
) {
  const created = OtecAccreditation.create({
    organizationId: overrides.organizationId ?? tenantId,
    otecProfileId: profileId,
    accreditationType: 'INTERNAL_TEST',
    accreditationNumber: overrides.accreditationNumber ?? `ACC-${Math.random().toString()}`,
    validFrom: overrides.validFrom ?? validFrom,
    validUntil: overrides.validUntil ?? validUntil,
  });
  return OtecAccreditation.rehydrate({ ...created.toPrimitives(), ...overrides });
}

function validCreateInput(otecProfileId: string) {
  return {
    otecProfileId,
    accreditationType: 'INTERNAL_TEST',
    accreditationNumber: 'ACC-NEW',
    validFrom,
    validUntil,
  };
}
