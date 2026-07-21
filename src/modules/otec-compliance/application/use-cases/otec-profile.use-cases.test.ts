import { describe, expect, it } from 'vitest';

import type { AuditLogInput, AuditLogger } from '../../../../shared/application/audit-logger.js';
import type { UseCaseContext } from '../../../../shared/application/use-case-context.js';
import {
  ConflictError,
  ForbiddenError,
  ModuleUnavailableError,
  NotFoundError,
} from '../../../../shared/domain/errors.js';
import { OtecProfile } from '../../domain/entities/otec-profile.entity.js';
import type {
  OtecProfileRepository,
  OtecProfileSearchFilters,
} from '../../domain/repositories/otec-profile.repository.js';
import type {
  OrganizationComplianceProjection,
  OrganizationComplianceReadPort,
} from '../ports/compliance-reference.ports.js';
import type {
  OtecComplianceTransactionManager,
  OtecComplianceUnitOfWork,
} from '../ports/otec-compliance-unit-of-work.js';
import { OtecComplianceAuthorizationPolicy } from '../services/otec-compliance-authorization.policy.js';
import { CreateOtecProfileUseCase } from './create-otec-profile.use-case.js';
import { DeactivateOtecProfileUseCase } from './deactivate-otec-profile.use-case.js';
import { GetOtecProfileUseCase } from './get-otec-profile.use-case.js';
import { UpdateOtecProfileUseCase } from './update-otec-profile.use-case.js';

const tenantId = '10000000-0000-4000-8000-000000000001';
const foreignTenantId = '10000000-0000-4000-8000-000000000002';
const context: UseCaseContext = {
  actorUserId: '10000000-0000-4000-8000-000000000003',
  organizationId: tenantId,
  ipAddress: '127.0.0.1',
  userAgent: 'vitest',
  permissions: ['otec_compliance.read', 'otec_compliance.profile.manage'],
};

describe('OTEC profile use cases', () => {
  it('creates and audits an active profile for the authenticated active OTEC tenant', async () => {
    const repository = new InMemoryOtecProfileRepository();
    const auditLogger = new RecordingAuditLogger();
    const useCase = new CreateOtecProfileUseCase(
      transactions(repository, auditLogger),
      new StubOrganizationReadPort(activeOtecOrganization()),
      authorization(),
    );

    const result = await useCase.execute(
      {
        registrationCode: 'OTEC-INTERNAL-001',
        technicalContactEmail: 'COMPLIANCE@EXAMPLE.TEST',
      },
      context,
    );

    expect(result).toMatchObject({
      organizationId: tenantId,
      registrationCode: 'OTEC-INTERNAL-001',
      registrationStatus: 'ACTIVE',
      technicalContactEmail: 'compliance@example.test',
      version: 1,
    });
    expect(repository.saved).toHaveLength(1);
    expect(auditLogger.entries).toContainEqual(
      expect.objectContaining({
        organizationId: tenantId,
        actorUserId: context.actorUserId,
        action: 'OTEC_PROFILE_CREATED',
        entityId: result.id,
      }),
    );
  });

  it.each([
    ['missing', null],
    ['non-OTEC', activeOtecOrganization({ type: 'CLIENT' })],
    ['inactive', activeOtecOrganization({ status: 'INACTIVE' })],
  ] as const)('rejects profile creation for a %s organization', async (_label, organization) => {
    const useCase = new CreateOtecProfileUseCase(
      transactions(new InMemoryOtecProfileRepository()),
      new StubOrganizationReadPort(organization),
      authorization(),
    );

    await expect(useCase.execute({}, context)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('rejects a second active profile for the tenant', async () => {
    const repository = new InMemoryOtecProfileRepository([
      OtecProfile.create({ organizationId: tenantId }),
    ]);
    const useCase = new CreateOtecProfileUseCase(
      transactions(repository),
      new StubOrganizationReadPort(activeOtecOrganization()),
      authorization(),
    );

    await expect(useCase.execute({}, context)).rejects.toBeInstanceOf(ConflictError);
  });

  it('reads the current profile only from the authenticated tenant context', async () => {
    const ownProfile = OtecProfile.create({ organizationId: tenantId });
    const foreignProfile = OtecProfile.create({ organizationId: foreignTenantId });
    const useCase = new GetOtecProfileUseCase(
      new InMemoryOtecProfileRepository([ownProfile, foreignProfile]),
      authorization(),
    );

    await expect(useCase.execute(context)).resolves.toMatchObject({
      id: ownProfile.id,
      organizationId: tenantId,
    });
    await expect(
      useCase.execute({ ...context, organizationId: foreignTenantId }),
    ).resolves.toMatchObject({ id: foreignProfile.id, organizationId: foreignTenantId });
  });

  it('does not resolve a missing or historical soft-deleted profile as current', async () => {
    const historical = OtecProfile.create({ organizationId: tenantId });
    historical.deactivate();
    const useCase = new GetOtecProfileUseCase(
      new InMemoryOtecProfileRepository([historical]),
      authorization(),
    );

    await expect(useCase.execute(context)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('keeps entitlement and read permission independent before singleton lookup', async () => {
    const profile = OtecProfile.create({ organizationId: tenantId });
    await expect(
      new GetOtecProfileUseCase(
        new InMemoryOtecProfileRepository([profile]),
        authorization(false),
      ).execute(context),
    ).rejects.toBeInstanceOf(ModuleUnavailableError);
    await expect(
      new GetOtecProfileUseCase(
        new InMemoryOtecProfileRepository([profile]),
        authorization(),
      ).execute({ ...context, permissions: ['otec_compliance.profile.manage'] }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('fails safely instead of choosing when current-profile cardinality is impossible', async () => {
    const first = OtecProfile.create({ organizationId: tenantId });
    const second = OtecProfile.create({ organizationId: tenantId });
    const useCase = new GetOtecProfileUseCase(
      new InMemoryOtecProfileRepository([first, second]),
      authorization(),
    );

    await expect(useCase.execute(context)).rejects.toThrow(
      'Current OTEC profile cardinality invariant violated',
    );
  });

  it('updates mutable profile fields with the supplied expected version and audit evidence', async () => {
    const profile = OtecProfile.create({ organizationId: tenantId, notes: 'Before' });
    const repository = new InMemoryOtecProfileRepository([profile]);
    const auditLogger = new RecordingAuditLogger();
    const useCase = new UpdateOtecProfileUseCase(
      transactions(repository, auditLogger),
      authorization(),
    );

    const result = await useCase.execute(
      { expectedVersion: 1, notes: 'After', technicalContactName: 'Compliance Owner' },
      context,
    );

    expect(result).toMatchObject({
      notes: 'After',
      technicalContactName: 'Compliance Owner',
      version: 2,
    });
    expect(repository.lastExpectedVersion).toBe(1);
    expect(auditLogger.entries.at(-1)).toMatchObject({ action: 'OTEC_PROFILE_UPDATED' });
  });

  it('propagates an optimistic-concurrency conflict without recording a success audit', async () => {
    const profile = OtecProfile.create({ organizationId: tenantId });
    const repository = new InMemoryOtecProfileRepository([profile]);
    repository.conflictOnUpdate = true;
    const auditLogger = new RecordingAuditLogger();
    const useCase = new UpdateOtecProfileUseCase(
      transactions(repository, auditLogger),
      authorization(),
    );

    await expect(
      useCase.execute({ expectedVersion: 0, notes: 'Stale' }, context),
    ).rejects.toBeInstanceOf(ConflictError);
    expect(auditLogger.entries).toHaveLength(0);
  });

  it('rejects singleton update before lookup when profile permission is absent', async () => {
    const profile = OtecProfile.create({ organizationId: tenantId });
    const useCase = new UpdateOtecProfileUseCase(transactions(new InMemoryOtecProfileRepository([profile])), authorization());

    await expect(
      useCase.execute(
        { expectedVersion: 1, notes: 'Denied' },
        { ...context, permissions: ['otec_compliance.read'] },
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(profile.toPrimitives()).toMatchObject({ notes: null, version: 1 });
  });

  it('soft-deactivates the profile using expectedVersion and records the transition', async () => {
    const profile = OtecProfile.create({ organizationId: tenantId });
    const repository = new InMemoryOtecProfileRepository([profile]);
    const auditLogger = new RecordingAuditLogger();
    const useCase = new DeactivateOtecProfileUseCase(
      transactions(repository, auditLogger),
      authorization(),
    );

    await useCase.execute({ expectedVersion: 1 }, context);

    expect(repository.lastExpectedVersion).toBe(1);
    expect(profile.toPrimitives()).toMatchObject({ registrationStatus: 'INACTIVE', version: 2 });
    expect(profile.toPrimitives().deletedAt).toBeInstanceOf(Date);
    expect(auditLogger.entries.at(-1)).toMatchObject({ action: 'OTEC_PROFILE_DEACTIVATED' });
  });

  it('treats a second singleton deactivation as not found and does not add an audit', async () => {
    const profile = OtecProfile.create({ organizationId: tenantId });
    const repository = new InMemoryOtecProfileRepository([profile]);
    const auditLogger = new RecordingAuditLogger();
    const useCase = new DeactivateOtecProfileUseCase(
      transactions(repository, auditLogger),
      authorization(),
    );

    await useCase.execute({ expectedVersion: 1 }, context);
    await expect(useCase.execute({ expectedVersion: 2 }, context)).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect(auditLogger.entries).toHaveLength(1);
  });

  it('rolls back the profile mutation when transactional audit persistence fails', async () => {
    const profile = OtecProfile.create({ organizationId: tenantId, notes: 'Before' });
    const repository = new InMemoryOtecProfileRepository([profile]);
    const failingAudit: AuditLogger = {
      record: async () => {
        throw new Error('Audit failed');
      },
    };
    const useCase = new UpdateOtecProfileUseCase(
      transactions(repository, failingAudit),
      authorization(),
    );

    await expect(
      useCase.execute({ expectedVersion: 1, notes: 'After' }, context),
    ).rejects.toThrow('Audit failed');
    expect((await repository.findById(tenantId, profile.id))?.toPrimitives()).toMatchObject({
      notes: 'Before',
      version: 1,
    });
  });
});

class InMemoryOtecProfileRepository implements OtecProfileRepository {
  readonly saved: OtecProfile[] = [];
  lastExpectedVersion: number | null = null;
  conflictOnUpdate = false;

  constructor(private readonly profiles: OtecProfile[] = []) {}

  snapshot() {
    return this.profiles.map((profile) => profile.toPrimitives());
  }
  restore(snapshot: ReturnType<OtecProfile['toPrimitives']>[]) {
    this.profiles.splice(0, this.profiles.length, ...snapshot.map(OtecProfile.rehydrate));
  }

  async findCurrentByOrganizationId(organizationId: string): Promise<OtecProfile | null> {
    const matches = this.profiles.filter((profile) => {
      const props = profile.toPrimitives();
      return (
        props.organizationId === organizationId &&
        props.registrationStatus === 'ACTIVE' &&
        props.deletedAt === null
      );
    });
    if (matches.length > 1) throw new Error('Current OTEC profile cardinality invariant violated');
    return matches[0] ?? null;
  }

  async findById(organizationId: string, id: string): Promise<OtecProfile | null> {
    return (
      this.profiles.find((profile) => {
        const props = profile.toPrimitives();
        return (
          props.id === id && props.organizationId === organizationId && props.deletedAt === null
        );
      }) ?? null
    );
  }

  async search(organizationId: string, filters: OtecProfileSearchFilters) {
    const data = this.profiles.filter((profile) => {
      const props = profile.toPrimitives();
      return (
        props.organizationId === organizationId &&
        props.deletedAt === null &&
        (!filters.status || props.registrationStatus === filters.status)
      );
    });
    return { data, meta: { page: 1, pageSize: 1, total: data.length, totalPages: data.length } };
  }

  async save(profile: OtecProfile): Promise<void> {
    this.saved.push(profile);
    this.profiles.push(profile);
  }

  async update(_profile: OtecProfile, expectedVersion: number): Promise<void> {
    this.lastExpectedVersion = expectedVersion;
    if (this.conflictOnUpdate) throw new ConflictError('Stale profile');
  }
}

class StubOrganizationReadPort implements OrganizationComplianceReadPort {
  constructor(private readonly organization: OrganizationComplianceProjection | null) {}
  async findById(): Promise<OrganizationComplianceProjection | null> {
    return this.organization;
  }
}

class RecordingAuditLogger implements AuditLogger {
  readonly entries: AuditLogInput[] = [];
  async record(input: AuditLogInput): Promise<void> {
    this.entries.push(input);
  }
}

function authorization(allowed = true): OtecComplianceAuthorizationPolicy {
  return new OtecComplianceAuthorizationPolicy({
    evaluate: async () =>
      allowed
        ? { allowed: true, reason: 'ENABLED' }
        : { allowed: false, reason: 'DISABLED' },
  });
}

function transactions(
  repository: InMemoryOtecProfileRepository,
  auditLogger: AuditLogger = new RecordingAuditLogger(),
): OtecComplianceTransactionManager {
  return {
    run: async <T>(work: (unitOfWork: OtecComplianceUnitOfWork) => Promise<T>) => {
      const snapshot = repository.snapshot();
      try {
        return await work({
          transactionBoundary: 'UNIT_OF_WORK',
          otecProfileRepository: repository,
          otecAccreditationRepository: {} as never,
          qualityCertificationRepository: {} as never,
          otecOfficeRepository: {} as never,
          legalRepresentativeRepository: {} as never,
          otecResolutionRepository: {} as never,
          documentOwnership: {} as never,
          auditLogger,
        });
      } catch (error) {
        repository.restore(snapshot);
        throw error;
      }
    },
  };
}

function activeOtecOrganization(
  overrides: Partial<OrganizationComplianceProjection> = {},
): OrganizationComplianceProjection {
  return {
    id: tenantId,
    legalName: 'Fictitious OTEC',
    tradeName: null,
    taxId: '76.555.555-5',
    type: 'OTEC',
    status: 'ACTIVE',
    ...overrides,
  };
}
