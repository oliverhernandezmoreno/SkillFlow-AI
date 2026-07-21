import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { prismaClient } from '../../../../infrastructure/prisma/prisma-client.js';
import { ConflictError } from '../../../../shared/domain/errors.js';
import { OtecProfile } from '../../domain/entities/otec-profile.entity.js';
import { PrismaOtecProfileRepository } from './prisma-otec-profile.repository.js';

const tenantAId = '10000000-0000-4000-8000-000000000001';
const tenantBId = '10000000-0000-4000-8000-000000000002';

describe('PrismaOtecProfileRepository integration', () => {
  const repository = new PrismaOtecProfileRepository(prismaClient);

  beforeAll(async () => {
    await cleanFixtures();
    await prismaClient.organization.createMany({
      data: [
        organizationFixture(tenantAId, '76.111.111-1'),
        organizationFixture(tenantBId, '76.222.222-2'),
      ],
    });
  });

  beforeEach(async () => {
    await prismaClient.otecProfile.deleteMany({
      where: { organizationId: { in: [tenantAId, tenantBId] } },
    });
  });

  afterAll(async () => {
    await cleanFixtures();
    await prismaClient.$disconnect();
  });

  it('paginates and filters active profiles within the authenticated tenant', async () => {
    const active = OtecProfile.create({ organizationId: tenantAId, registrationCode: 'ACTIVE-A' });
    const deleted = OtecProfile.create({
      organizationId: tenantAId,
      registrationCode: 'DELETED-A',
    });
    deleted.deactivate();
    const otherTenant = OtecProfile.create({
      organizationId: tenantBId,
      registrationCode: 'ACTIVE-B',
    });
    await repository.save(active);
    await repository.save(deleted);
    await repository.save(otherTenant);

    const result = await repository.search(
      tenantAId,
      { status: 'ACTIVE' },
      { page: 1, pageSize: 1 },
    );

    expect(result.data.map((profile) => profile.id)).toEqual([active.id]);
    expect(result.meta).toMatchObject({ page: 1, pageSize: 1, total: 1, totalPages: 1 });
  });

  it('does not disclose a profile through another tenant', async () => {
    const profile = OtecProfile.create({ organizationId: tenantAId });
    await repository.save(profile);

    await expect(repository.findById(tenantBId, profile.id)).resolves.toBeNull();
  });

  it('resolves only the active non-deleted singleton for the requested tenant', async () => {
    const tenantAProfile = OtecProfile.create({ organizationId: tenantAId });
    const tenantBProfile = OtecProfile.create({ organizationId: tenantBId });
    const inactiveNonDeleted = OtecProfile.rehydrate({
      ...OtecProfile.create({ organizationId: tenantAId }).toPrimitives(),
      registrationStatus: 'INACTIVE',
    });
    await repository.save(tenantAProfile);
    await repository.save(tenantBProfile);
    await repository.save(inactiveNonDeleted);

    await expect(repository.findCurrentByOrganizationId(tenantAId)).resolves.toMatchObject({
      id: tenantAProfile.id,
    });
    await expect(repository.findCurrentByOrganizationId(tenantBId)).resolves.toMatchObject({
      id: tenantBProfile.id,
    });
  });

  it('returns no current singleton after soft deletion and permits deterministic recreation', async () => {
    const historical = OtecProfile.create({ organizationId: tenantAId });
    await repository.save(historical);
    historical.deactivate();
    await repository.update(historical, 1);

    await expect(repository.findCurrentByOrganizationId(tenantAId)).resolves.toBeNull();
    const replacement = OtecProfile.create({ organizationId: tenantAId });
    await repository.save(replacement);
    await expect(repository.findCurrentByOrganizationId(tenantAId)).resolves.toMatchObject({
      id: replacement.id,
    });
  });

  it('rejects stale optimistic versions without changing the record', async () => {
    const profile = OtecProfile.create({ organizationId: tenantAId });
    await repository.save(profile);
    profile.deactivate();
    await repository.update(profile, 1);

    await expect(repository.update(profile, 1)).rejects.toBeInstanceOf(ConflictError);
    const persisted = await prismaClient.otecProfile.findUniqueOrThrow({
      where: { id: profile.id },
    });
    expect(persisted.version).toBe(2);
    await expect(repository.update(profile, 2)).rejects.toBeInstanceOf(ConflictError);
  });

  it('allows only one of two concurrent singleton updates with the same expected version', async () => {
    const profile = OtecProfile.create({ organizationId: tenantAId, notes: 'Before' });
    await repository.save(profile);
    const first = await repository.findCurrentByOrganizationId(tenantAId);
    const second = await repository.findCurrentByOrganizationId(tenantAId);
    if (!first || !second) throw new Error('Expected current profiles');
    first.update({ notes: 'First' });
    second.update({ notes: 'Second' });

    const results = await Promise.allSettled([
      repository.update(first, 1),
      repository.update(second, 1),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
    expect((await repository.findCurrentByOrganizationId(tenantAId))?.toPrimitives().version).toBe(
      2,
    );
  });

  it('maps active uniqueness to conflict and permits reuse after soft deletion', async () => {
    const first = OtecProfile.create({ organizationId: tenantAId });
    const duplicate = OtecProfile.create({ organizationId: tenantAId });
    await repository.save(first);
    await expect(repository.save(duplicate)).rejects.toBeInstanceOf(ConflictError);
    first.deactivate();
    await repository.update(first, 1);
    await expect(repository.save(duplicate)).resolves.toBeUndefined();
  });
});

function organizationFixture(id: string, taxId: string) {
  return {
    id,
    legalName: `Repository Test ${id}`,
    taxId,
    email: `${id}@example.test`,
    type: 'OTEC' as const,
    status: 'ACTIVE' as const,
  };
}

async function cleanFixtures(): Promise<void> {
  await prismaClient.otecComplianceSettings.deleteMany({
    where: { organizationId: { in: [tenantAId, tenantBId] } },
  });
  await prismaClient.otecProfile.deleteMany({
    where: { organizationId: { in: [tenantAId, tenantBId] } },
  });
  await prismaClient.organization.deleteMany({ where: { id: { in: [tenantAId, tenantBId] } } });
}
