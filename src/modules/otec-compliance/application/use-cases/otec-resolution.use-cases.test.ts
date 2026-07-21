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
import { OtecResolution } from '../../domain/entities/otec-resolution.entity.js';
import type {
  OtecProfileRepository,
  OtecProfileSearchFilters,
} from '../../domain/repositories/otec-profile.repository.js';
import type {
  OtecResolutionFilters,
  OtecResolutionRepository,
} from '../../domain/repositories/otec-regulatory-record.repositories.js';
import {
  OtecReadinessEvaluator,
  type OtecReadinessSnapshot,
} from '../../domain/services/otec-readiness-evaluator.js';
import { ResolutionChainResolver } from '../../domain/services/resolution-chain-resolver.js';
import type { TenantDocumentOwnershipPort } from '../ports/compliance-reference.ports.js';
import type {
  OtecComplianceTransactionManager,
  OtecComplianceUnitOfWork,
} from '../ports/otec-compliance-unit-of-work.js';
import { CreateOtecResolutionUseCase } from './create-otec-resolution.use-case.js';
import { DeactivateOtecResolutionUseCase } from './deactivate-otec-resolution.use-case.js';
import { GetOtecResolutionUseCase } from './get-otec-resolution.use-case.js';
import { ListOtecResolutionsUseCase } from './list-otec-resolutions.use-case.js';
import { SupersedeOtecResolutionUseCase } from './supersede-otec-resolution.use-case.js';
import { UpdateOtecResolutionUseCase } from './update-otec-resolution.use-case.js';

const tenantId = '28000000-0000-4000-8000-000000000001';
const foreignTenantId = '28000000-0000-4000-8000-000000000002';
const context: UseCaseContext = {
  actorUserId: '28000000-0000-4000-8000-000000000003',
  organizationId: tenantId,
  correlationId: 'resolution-correlation-001',
  permissions: ['otec_compliance.read', 'otec_compliance.resolution.manage'],
};
const evaluatedAt = new Date('2026-07-16');
const validFrom = new Date('2026-01-01');
const validUntil = new Date('2027-01-01');
const enabled = { evaluate: async () => ({ allowed: true as const, reason: 'ENABLED' as const }) };
const disabled = {
  evaluate: async () => ({ allowed: false as const, reason: 'DISABLED' as const }),
};
const now = () => evaluatedAt;

describe('OtecResolution use cases', () => {
  it('creates a normalized same-tenant resolution with document ownership and audit', async () => {
    const profile = OtecProfile.create({ organizationId: tenantId });
    const state = createState([profile]);
    state.documents.add('owned');
    const result = await new CreateOtecResolutionUseCase(
      new InMemoryTransactionManager(state),
      enabled,
      now,
    ).execute(
      {
        ...createInput(profile.id),
        organizationId: foreignTenantId,
        resolutionNumber: ' res-001 ',
        documentId: 'owned',
      },
      context,
    );
    expect(result).toMatchObject({
      organizationId: tenantId,
      resolutionNumber: 'RES-001',
      status: 'ACTIVE',
      version: 1,
    });
    expect(state.audits.at(-1)).toMatchObject({
      action: 'OTEC_RESOLUTION_CREATED',
      organizationId: tenantId,
      metadata: { correlationId: 'resolution-correlation-001', internalRecordOnly: true },
    });
  });
  it('rejects unavailable entitlement and missing/inactive/foreign profiles without writes', async () => {
    const active = OtecProfile.create({ organizationId: tenantId });
    const inactive = OtecProfile.rehydrate({
      ...OtecProfile.create({ organizationId: tenantId }).toPrimitives(),
      registrationStatus: 'INACTIVE',
    });
    const foreign = OtecProfile.create({ organizationId: foreignTenantId });
    const state = createState([active, inactive, foreign]);
    await expect(
      new CreateOtecResolutionUseCase(new InMemoryTransactionManager(state), disabled, now).execute(
        createInput(active.id),
        context,
      ),
    ).rejects.toBeInstanceOf(ModuleUnavailableError);
    const useCase = new CreateOtecResolutionUseCase(
      new InMemoryTransactionManager(state),
      enabled,
      now,
    );
    for (const id of ['missing', inactive.id, foreign.id])
      await expect(useCase.execute(createInput(id), context)).rejects.toBeInstanceOf(NotFoundError);
    expect(state.resolutions).toHaveLength(0);
  });
  it('rejects invalid number/type/date relationships, foreign document, and active duplicate', async () => {
    const profile = OtecProfile.create({ organizationId: tenantId });
    const duplicate = resolution(profile.id, { resolutionNumber: 'DUP' });
    const state = createState([profile], [duplicate]);
    const useCase = new CreateOtecResolutionUseCase(
      new InMemoryTransactionManager(state),
      enabled,
      now,
    );
    await expect(
      useCase.execute({ ...createInput(profile.id), resolutionNumber: ' ' }, context),
    ).rejects.toBeInstanceOf(BadRequestError);
    await expect(
      useCase.execute({ ...createInput(profile.id), resolutionType: 'INVALID' }, context),
    ).rejects.toBeInstanceOf(BadRequestError);
    await expect(
      useCase.execute(
        { ...createInput(profile.id), validFrom: validUntil, validUntil: validFrom },
        context,
      ),
    ).rejects.toBeInstanceOf(BadRequestError);
    await expect(
      useCase.execute(
        {
          ...createInput(profile.id),
          issuedAt: new Date('2026-06-01'),
          validFrom: new Date('2026-05-01'),
        },
        context,
      ),
    ).rejects.toBeInstanceOf(BadRequestError);
    await expect(
      useCase.execute({ ...createInput(profile.id), documentId: 'foreign' }, context),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      useCase.execute({ ...createInput(profile.id), resolutionNumber: 'dup' }, context),
    ).rejects.toBeInstanceOf(ConflictError);
    expect(state.resolutions).toHaveLength(1);
  });
  it('rolls back creation when audit fails', async () => {
    const profile = OtecProfile.create({ organizationId: tenantId });
    const state = createState([profile]);
    state.failAudit = true;
    await expect(
      new CreateOtecResolutionUseCase(new InMemoryTransactionManager(state), enabled, now).execute(
        createInput(profile.id),
        context,
      ),
    ).rejects.toThrow('Audit failed');
    expect(state.resolutions).toHaveLength(0);
  });
  it('lists tenant records by profile/type/status/current/future/expired with deterministic pagination and empty results', async () => {
    const records = [
      resolution('p', { resolutionNumber: 'A', createdAt: new Date('2026-01-01') }),
      resolution('p', { resolutionNumber: 'B', createdAt: new Date('2026-02-01') }),
      resolution('p', { resolutionNumber: 'FUTURE', validFrom: new Date('2026-08-01') }),
      resolution('p', { resolutionNumber: 'EXPIRED', validUntil: new Date('2026-01-02') }),
      resolution('other', { resolutionNumber: 'OTHER-PROFILE' }),
      resolution('p', { resolutionNumber: 'TYPE', resolutionType: 'MODIFICATION' }),
      resolution('p', { deletedAt: evaluatedAt }),
      resolution('p', { organizationId: foreignTenantId }),
    ];
    const useCase = new ListOtecResolutionsUseCase(
      new InMemoryTransactionManager(createState([], records)),
      enabled,
      now,
    );
    const page = await useCase.execute(
      {
        otecProfileId: 'p',
        resolutionType: 'AUTHORIZATION',
        status: 'ACTIVE',
        validAt: evaluatedAt,
      },
      { page: 1, pageSize: 1 },
      context,
    );
    expect(page.meta).toMatchObject({ total: 2, totalPages: 2 });
    expect(page.data[0]?.resolutionNumber).toBe('B');
    expect(
      (
        await useCase.execute({ validFromAfter: evaluatedAt }, { page: 1, pageSize: 10 }, context)
      ).data.map((x) => x.resolutionNumber),
    ).toEqual(['FUTURE']);
    expect(
      (
        await useCase.execute({ validUntilBefore: evaluatedAt }, { page: 1, pageSize: 10 }, context)
      ).data.map((x) => x.resolutionNumber),
    ).toEqual(['EXPIRED']);
    await expect(
      useCase.execute({}, { page: 1, pageSize: 10 }, { ...context, organizationId: 'empty' }),
    ).resolves.toMatchObject({ data: [] });
  });
  it('gets only own non-deleted resolution and exposes the approved predecessor link', async () => {
    const previous = resolution('p');
    const own = resolution('p', { supersedesResolutionId: previous.id });
    const foreign = resolution('p', { organizationId: foreignTenantId });
    const deleted = resolution('p', { deletedAt: evaluatedAt });
    const useCase = new GetOtecResolutionUseCase(
      new InMemoryTransactionManager(createState([], [previous, own, foreign, deleted])),
      enabled,
      now,
    );
    await expect(useCase.execute(own.id, context)).resolves.toMatchObject({
      id: own.id,
      supersedesResolutionId: previous.id,
    });
    await expect(useCase.execute(foreign.id, context)).rejects.toBeInstanceOf(NotFoundError);
    await expect(useCase.execute(deleted.id, context)).rejects.toBeInstanceOf(NotFoundError);
    await expect(useCase.execute('missing', context)).rejects.toBeInstanceOf(NotFoundError);
  });
  it('updates administrative fields with expectedVersion and safe audit, while protecting scope and supersession', async () => {
    const own = resolution('p');
    const foreign = resolution('p', { organizationId: foreignTenantId });
    const state = createState([], [own, foreign]);
    state.documents.add('owned');
    const useCase = new UpdateOtecResolutionUseCase(
      new InMemoryTransactionManager(state),
      enabled,
      now,
    );
    const result = await useCase.execute(
      own.id,
      { expectedVersion: 1, issuingAuthority: ' Updated ', documentId: 'owned' },
      context,
    );
    expect(result).toMatchObject({ issuingAuthority: 'Updated', version: 2 });
    expect(state.lastExpectedVersion).toBe(1);
    expect(state.audits.at(-1)?.before).toBeDefined();
    state.conflict = true;
    await expect(
      useCase.execute(own.id, { expectedVersion: 1, notes: 'stale' }, context),
    ).rejects.toBeInstanceOf(ConflictError);
    state.conflict = false;
    await expect(
      useCase.execute(own.id, { expectedVersion: 2, organizationId: foreignTenantId }, context),
    ).rejects.toBeInstanceOf(BadRequestError);
    await expect(
      useCase.execute(own.id, { expectedVersion: 2, otecProfileId: 'other' }, context),
    ).rejects.toBeInstanceOf(BadRequestError);
    await expect(
      useCase.execute(own.id, { expectedVersion: 2, supersedesResolutionId: 'manual' }, context),
    ).rejects.toBeInstanceOf(BadRequestError);
    await expect(
      useCase.execute(foreign.id, { expectedVersion: 1, notes: 'no' }, context),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
  it('rolls back update when audit fails and preserves data on validation failure', async () => {
    const item = resolution('p', { notes: 'Before' });
    const state = createState([], [item]);
    const useCase = new UpdateOtecResolutionUseCase(
      new InMemoryTransactionManager(state),
      enabled,
      now,
    );
    await expect(
      useCase.execute(
        item.id,
        { expectedVersion: 1, validFrom: validUntil, validUntil: validFrom },
        context,
      ),
    ).rejects.toBeInstanceOf(BadRequestError);
    state.failAudit = true;
    await expect(
      useCase.execute(item.id, { expectedVersion: 1, notes: 'After' }, context),
    ).rejects.toThrow('Audit failed');
    expect(state.resolutions[0]?.toPrimitives()).toMatchObject({ notes: 'Before', version: 1 });
  });
  it('atomically supersedes existing same-profile resolutions and records one business audit', async () => {
    const old = resolution('p');
    const replacement = resolution('p');
    const state = createState([], [old, replacement]);
    const result = await new SupersedeOtecResolutionUseCase(
      new InMemoryTransactionManager(state),
      enabled,
      now,
    ).execute(
      {
        replacedResolutionId: old.id,
        replacementResolutionId: replacement.id,
        replacedExpectedVersion: 1,
        replacementExpectedVersion: 1,
        reason: 'Replacement',
      },
      context,
    );
    expect(result.replaced).toMatchObject({ status: 'SUPERSEDED', version: 2 });
    expect(result.replacement).toMatchObject({ supersedesResolutionId: old.id, version: 2 });
    expect(state.audits).toHaveLength(1);
    expect(state.audits[0]).toMatchObject({
      action: 'OTEC_RESOLUTION_SUPERSEDED',
      metadata: { correlationId: 'resolution-correlation-001' },
    });
  });
  it('rejects self, tenant/profile mismatch, inactive/deleted replacement, stale versions, already superseded, and cycles', async () => {
    const old = resolution('p');
    const replacement = resolution('p');
    const foreign = resolution('p', { organizationId: foreignTenantId });
    const otherProfile = resolution('other');
    const inactive = resolution('p', { status: 'INACTIVE' });
    const deleted = resolution('p', { deletedAt: evaluatedAt });
    const already = resolution('p', { status: 'SUPERSEDED' });
    const state = createState(
      [],
      [old, replacement, foreign, otherProfile, inactive, deleted, already],
    );
    const useCase = new SupersedeOtecResolutionUseCase(
      new InMemoryTransactionManager(state),
      enabled,
      now,
    );
    const input = {
      replacedResolutionId: old.id,
      replacementResolutionId: replacement.id,
      replacedExpectedVersion: 1,
      replacementExpectedVersion: 1,
    };
    await expect(
      useCase.execute({ ...input, replacementResolutionId: old.id }, context),
    ).rejects.toBeInstanceOf(BadRequestError);
    await expect(
      useCase.execute({ ...input, replacementResolutionId: foreign.id }, context),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      useCase.execute({ ...input, replacementResolutionId: otherProfile.id }, context),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      useCase.execute({ ...input, replacementResolutionId: inactive.id }, context),
    ).rejects.toBeInstanceOf(BadRequestError);
    await expect(
      useCase.execute({ ...input, replacementResolutionId: deleted.id }, context),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      useCase.execute({ ...input, replacedResolutionId: already.id }, context),
    ).rejects.toBeInstanceOf(BadRequestError);
    state.conflict = true;
    await expect(useCase.execute(input, context)).rejects.toBeInstanceOf(ConflictError);
    state.conflict = false;
    replacement.supersede(old.id, evaluatedAt);
    old.markSuperseded(evaluatedAt);
    await state.repository.supersede(replacement, old, 1, 1);
    const reverse = {
      replacedResolutionId: replacement.id,
      replacementResolutionId: old.id,
      replacedExpectedVersion: 2,
      replacementExpectedVersion: 2,
    };
    await expect(useCase.execute(reverse, context)).rejects.toBeInstanceOf(ConflictError);
  });
  it('rolls back both supersession sides when audit fails and handles concurrent attempts', async () => {
    const old = resolution('p');
    const first = resolution('p');
    const second = resolution('p');
    const state = createState([], [old, first, second]);
    state.failAudit = true;
    const useCase = new SupersedeOtecResolutionUseCase(
      new InMemoryTransactionManager(state),
      enabled,
      now,
    );
    const input = {
      replacedResolutionId: old.id,
      replacementResolutionId: first.id,
      replacedExpectedVersion: 1,
      replacementExpectedVersion: 1,
    };
    await expect(useCase.execute(input, context)).rejects.toThrow('Audit failed');
    expect(state.resolutions.map((x) => x.toPrimitives())).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: old.id, status: 'ACTIVE', version: 1 }),
        expect.objectContaining({ id: first.id, supersedesResolutionId: null, version: 1 }),
      ]),
    );
    state.failAudit = false;
    await useCase.execute(input, context);
    await expect(
      useCase.execute({ ...input, replacementResolutionId: second.id }, context),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
  it('reconstructs a five-level history from initial to terminal', async () => {
    const records = Array.from({ length: 5 }, () => resolution('p'));
    for (let index = 1; index < records.length; index += 1) {
      const current = records[index];
      const previous = records[index - 1];
      if (!current || !previous) throw new Error('Incomplete test chain');
      current.supersede(previous.id, evaluatedAt);
      previous.markSuperseded(evaluatedAt);
    }
    const terminal = records.at(-1);
    if (!terminal) throw new Error('Missing terminal resolution');
    const links = new Map(records.map((x) => [x.id, x.toPrimitives().supersedesResolutionId]));
    expect(new ResolutionChainResolver().resolve(links, terminal.id)).toEqual(
      records.map((x) => x.id),
    );
  });
  it('soft-deactivates only usable terminal resolution with concurrency/audit and rollback', async () => {
    const active = resolution('p');
    const historical = resolution('p', { status: 'SUPERSEDED' });
    const foreign = resolution('p', { organizationId: foreignTenantId });
    const state = createState([], [active, historical, foreign]);
    const useCase = new DeactivateOtecResolutionUseCase(
      new InMemoryTransactionManager(state),
      enabled,
      now,
    );
    const result = await useCase.execute(
      active.id,
      { expectedVersion: 1, reason: 'Inactive' },
      context,
    );
    expect(result).toMatchObject({ status: 'INACTIVE', deletedAt: evaluatedAt, version: 2 });
    await expect(
      useCase.execute(active.id, { expectedVersion: 2 }, context),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      useCase.execute(historical.id, { expectedVersion: 1 }, context),
    ).rejects.toBeInstanceOf(BadRequestError);
    await expect(
      useCase.execute(foreign.id, { expectedVersion: 1 }, context),
    ).rejects.toBeInstanceOf(NotFoundError);
    const rollback = resolution('p');
    const rollbackState = createState([], [rollback]);
    rollbackState.failAudit = true;
    await expect(
      new DeactivateOtecResolutionUseCase(
        new InMemoryTransactionManager(rollbackState),
        enabled,
        now,
      ).execute(rollback.id, { expectedVersion: 1 }, context),
    ).rejects.toThrow('Audit failed');
    expect(rollbackState.resolutions[0]?.toPrimitives()).toMatchObject({
      status: 'ACTIVE',
      version: 1,
    });
  });
  it('readiness counts only a current active terminal resolution of each configured type', () => {
    const evaluator = new OtecReadinessEvaluator();
    const snapshot = readySnapshot();
    expect(resCheck(evaluator.evaluate(snapshot, evaluatedAt).blockingIssues)).toBeUndefined();
    for (const record of [
      { ...effectiveResolution(), status: 'INACTIVE' },
      { ...effectiveResolution(), validFrom: new Date('2026-08-01') },
      { ...effectiveResolution(), validUntil: new Date('2026-07-15') },
      { ...effectiveResolution(), superseded: true },
    ]) {
      snapshot.resolutions = [record];
      expect(resCheck(evaluator.evaluate(snapshot, evaluatedAt).blockingIssues)).toBeDefined();
    }
    snapshot.resolutions = [
      { ...effectiveResolution('old'), superseded: true },
      effectiveResolution('terminal'),
    ];
    expect(resCheck(evaluator.evaluate(snapshot, evaluatedAt).blockingIssues)).toBeUndefined();
  });
  it('excludes soft-deleted and foreign resolutions from readiness and deactivation removes the only terminal evidence', async () => {
    const active = resolution('p');
    const state = createState(
      [],
      [
        active,
        resolution('p', { deletedAt: evaluatedAt }),
        resolution('p', { organizationId: foreignTenantId }),
      ],
    );
    const list = new ListOtecResolutionsUseCase(
      new InMemoryTransactionManager(state),
      enabled,
      now,
    );
    const before = await list.execute(
      { status: 'ACTIVE', validAt: evaluatedAt },
      { page: 1, pageSize: 10 },
      context,
    );
    const snapshot = readySnapshot();
    snapshot.resolutions = before.data.map((x) => ({
      id: x.id,
      status: x.status,
      validFrom: x.validFrom,
      validUntil: x.validUntil,
      resolutionType: x.resolutionType,
      superseded: x.status === 'SUPERSEDED',
    }));
    expect(
      resCheck(new OtecReadinessEvaluator().evaluate(snapshot, evaluatedAt).blockingIssues),
    ).toBeUndefined();
    await new DeactivateOtecResolutionUseCase(
      new InMemoryTransactionManager(state),
      enabled,
      now,
    ).execute(active.id, { expectedVersion: 1 }, context);
    const after = await list.execute(
      { status: 'ACTIVE', validAt: evaluatedAt },
      { page: 1, pageSize: 10 },
      context,
    );
    snapshot.resolutions = after.data.map((x) => ({
      id: x.id,
      status: x.status,
      validFrom: x.validFrom,
      validUntil: x.validUntil,
      resolutionType: x.resolutionType,
      superseded: x.status === 'SUPERSEDED',
    }));
    expect(
      resCheck(new OtecReadinessEvaluator().evaluate(snapshot, evaluatedAt).blockingIssues),
    ).toBeDefined();
  });
});

interface State {
  profiles: OtecProfile[];
  resolutions: OtecResolution[];
  audits: AuditLogInput[];
  documents: Set<string>;
  failAudit: boolean;
  conflict: boolean;
  lastExpectedVersion: number | null;
  repository: InMemoryResolutionRepository;
  profileRepository: InMemoryProfileRepository;
  ownership: TenantDocumentOwnershipPort;
}
function createState(profiles: OtecProfile[] = [], resolutions: OtecResolution[] = []): State {
  const state = {
    profiles,
    resolutions,
    audits: [],
    documents: new Set<string>(),
    failAudit: false,
    conflict: false,
    lastExpectedVersion: null,
  } as unknown as State;
  state.repository = new InMemoryResolutionRepository(resolutions, state);
  state.profileRepository = new InMemoryProfileRepository(profiles);
  state.ownership = { belongsToTenant: async (_o, id) => state.documents.has(id) };
  return state;
}
class InMemoryTransactionManager implements OtecComplianceTransactionManager {
  constructor(private readonly state: State) {}
  async run<T>(work: (uow: OtecComplianceUnitOfWork) => Promise<T>): Promise<T> {
    const before = this.state.resolutions.map((x) => x.toPrimitives());
    const audits = [...this.state.audits];
    try {
      return await work({
        transactionBoundary: 'UNIT_OF_WORK',
        otecAccreditationRepository: {} as never,
        qualityCertificationRepository: {} as never,
        otecOfficeRepository: {} as never,
        legalRepresentativeRepository: {} as never,
        otecResolutionRepository: this.state.repository,
        otecProfileRepository: this.state.profileRepository,
        documentOwnership: this.state.ownership,
        auditLogger: {
          record: async (input) => {
            if (this.state.failAudit) throw new Error('Audit failed');
            this.state.audits.push(input);
          },
        },
      });
    } catch (error) {
      this.state.resolutions.splice(
        0,
        this.state.resolutions.length,
        ...before.map(OtecResolution.rehydrate),
      );
      this.state.audits.splice(0, this.state.audits.length, ...audits);
      throw error;
    }
  }
}
class InMemoryResolutionRepository implements OtecResolutionRepository {
  constructor(
    private readonly records: OtecResolution[],
    private readonly state?: State,
  ) {}
  async findById(o: string, id: string) {
    return (
      this.records.find((x) => {
        const p = x.toPrimitives();
        return p.organizationId === o && p.id === id && !p.deletedAt;
      }) ?? null
    );
  }
  async search(o: string, f: OtecResolutionFilters, p: { page: number; pageSize: number }) {
    const data = this.records
      .filter((x) => {
        const r = x.toPrimitives();
        return (
          r.organizationId === o &&
          !r.deletedAt &&
          (!f.otecProfileId || r.otecProfileId === f.otecProfileId) &&
          (!f.resolutionType || r.resolutionType === f.resolutionType) &&
          (!f.status || r.status === f.status) &&
          (!f.validAt ||
            ((!r.validFrom || r.validFrom <= f.validAt) &&
              (!r.validUntil || r.validUntil >= f.validAt))) &&
          (!f.validFromAfter || (!!r.validFrom && r.validFrom > f.validFromAfter)) &&
          (!f.validUntilBefore || (!!r.validUntil && r.validUntil <= f.validUntilBefore))
        );
      })
      .sort(
        (a, b) =>
          b.toPrimitives().createdAt.getTime() - a.toPrimitives().createdAt.getTime() ||
          a.id.localeCompare(b.id),
      );
    const start = (p.page - 1) * p.pageSize;
    return {
      data: data.slice(start, start + p.pageSize),
      meta: { ...p, total: data.length, totalPages: Math.ceil(data.length / p.pageSize) },
    };
  }
  async save(item: OtecResolution) {
    const p = item.toPrimitives();
    if (
      this.records.some((x) => {
        const r = x.toPrimitives();
        return (
          r.organizationId === p.organizationId &&
          r.otecProfileId === p.otecProfileId &&
          r.resolutionNumber === p.resolutionNumber &&
          r.status === 'ACTIVE' &&
          !r.deletedAt
        );
      })
    )
      throw new ConflictError('Duplicate');
    this.records.push(item);
  }
  async update(_item: OtecResolution, expected: number) {
    if (this.state) {
      this.state.lastExpectedVersion = expected;
      if (this.state.conflict) throw new ConflictError('Stale');
    }
  }
  async supersede(
    replacement: OtecResolution,
    replaced: OtecResolution,
    replacementExpected: number,
    replacedExpected: number,
  ) {
    if (this.state?.conflict || replacementExpected !== 1 || replacedExpected !== 1)
      throw new ConflictError('Stale');
    const links = new Map(this.records.map((x) => [x.id, x.toPrimitives().supersedesResolutionId]));
    links.set(replacement.id, replaced.id);
    new ResolutionChainResolver().assertAcyclic(links);
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
  async findById(o: string, id: string) {
    return (
      this.records.find((x) => {
        const p = x.toPrimitives();
        return p.organizationId === o && p.id === id && !p.deletedAt;
      }) ?? null
    );
  }
  async search(_o: string, _f: OtecProfileSearchFilters, p: { page: number; pageSize: number }) {
    return { data: [], meta: { ...p, total: 0, totalPages: 0 } };
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
    resolutionType: 'AUTHORIZATION' as const,
    resolutionNumber: 'RES-NEW',
    issuingAuthority: 'Fictitious Authority',
    issuedAt: new Date('2026-01-01'),
    validFrom,
    validUntil,
  };
}
function resolution(
  profileId: string,
  overrides: Partial<ReturnType<OtecResolution['toPrimitives']>> = {},
) {
  const item = OtecResolution.create({
    ...createInput(profileId),
    organizationId: overrides.organizationId ?? tenantId,
    resolutionNumber: overrides.resolutionNumber ?? `RES-${Math.random().toString()}`,
  });
  return OtecResolution.rehydrate({ ...item.toPrimitives(), ...overrides });
}
function effectiveResolution(id = 'res') {
  return {
    id,
    status: 'ACTIVE',
    validFrom,
    validUntil,
    resolutionType: 'AUTHORIZATION',
    superseded: false,
  };
}
function resCheck(checks: { ruleCode: string }[]) {
  return checks.find((x) => x.ruleCode === 'OTEC-RES-001');
}
function readySnapshot(): OtecReadinessSnapshot {
  return {
    organization: { id: tenantId, type: 'OTEC', status: 'ACTIVE' },
    profile: { id: 'p', status: 'ACTIVE' },
    settings: {
      requireNch2728: false,
      requiredResolutionTypes: ['AUTHORIZATION'],
      qualifyingOfficeTypes: ['HEADQUARTERS'],
      expirationWarningDays: [30],
      undatedRecordTreatment: 'WARNING',
    },
    accreditations: [{ id: 'a', status: 'ACTIVE', validFrom, validUntil }],
    certifications: [],
    offices: [{ id: 'o', status: 'ACTIVE', validFrom, validUntil, officeType: 'HEADQUARTERS' }],
    representatives: [{ id: 'r', status: 'ACTIVE', active: true, validFrom, validUntil }],
    resolutions: [effectiveResolution()],
  };
}
