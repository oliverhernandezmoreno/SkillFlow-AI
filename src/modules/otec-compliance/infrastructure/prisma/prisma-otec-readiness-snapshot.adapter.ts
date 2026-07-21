import { Prisma, type PrismaClient } from '@prisma/client';

import { prismaClient } from '../../../../infrastructure/prisma/prisma-client.js';
import type { OtecReadinessSnapshotReadPort } from '../../application/ports/otec-readiness-snapshot-read.port.js';
import type { OtecReadinessSnapshot } from '../../domain/services/otec-readiness-evaluator.js';

export class PrismaOtecReadinessSnapshotAdapter implements OtecReadinessSnapshotReadPort {
  constructor(private readonly prisma: PrismaClient = prismaClient) {}

  async load(input: {
    organizationId: string;
    otecProfileId: string;
    evaluatedAt: Date;
  }): Promise<OtecReadinessSnapshot | null> {
    return this.prisma.$transaction(
      async (transaction) => this.loadWithinTransaction(transaction, input),
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
  }

  private async loadWithinTransaction(
    transaction: Prisma.TransactionClient,
    input: { organizationId: string; otecProfileId: string; evaluatedAt: Date },
  ): Promise<OtecReadinessSnapshot | null> {
    const scope = { organizationId: input.organizationId, otecProfileId: input.otecProfileId };
    const [
      organization,
      profile,
      settings,
      accreditations,
      certifications,
      offices,
      representatives,
      resolutions,
    ] = await Promise.all([
      transaction.organization.findFirst({
        where: { id: input.organizationId, deletedAt: null },
        select: { id: true, type: true, status: true },
      }),
      transaction.otecProfile.findFirst({
        where: { id: input.otecProfileId, organizationId: input.organizationId, deletedAt: null },
        select: { id: true, status: true },
      }),
      transaction.otecComplianceSettings.findFirst({
        where: {
          ...scope,
          deletedAt: null,
          effectiveFrom: { lte: input.evaluatedAt },
          OR: [{ effectiveTo: null }, { effectiveTo: { gte: input.evaluatedAt } }],
        },
        orderBy: [{ effectiveFrom: 'desc' }, { id: 'asc' }],
        select: {
          id: true,
          version: true,
          sourceVersion: true,
          requireNch2728: true,
          requiredResolutionTypes: true,
          qualifyingOfficeTypes: true,
          expirationWarningDays: true,
          undatedRecordTreatment: true,
        },
      }),
      transaction.otecAccreditation.findMany({
        where: { ...scope, deletedAt: null },
        select: { id: true, status: true, validFrom: true, validUntil: true },
      }),
      transaction.qualityCertification.findMany({
        where: { ...scope, deletedAt: null },
        select: {
          id: true,
          status: true,
          validFrom: true,
          validUntil: true,
          certificationType: true,
        },
      }),
      transaction.otecOffice.findMany({
        where: { ...scope, deletedAt: null },
        select: { id: true, status: true, validFrom: true, validUntil: true, officeType: true },
      }),
      transaction.legalRepresentative.findMany({
        where: { ...scope, deletedAt: null },
        select: { id: true, active: true, validFrom: true, validUntil: true },
      }),
      transaction.otecResolution.findMany({
        where: { ...scope, deletedAt: null },
        select: {
          id: true,
          status: true,
          validFrom: true,
          validUntil: true,
          resolutionType: true,
          supersededBy: { where: { deletedAt: null }, select: { id: true }, take: 1 },
        },
      }),
    ]);

    if (!organization || !profile) return null;

    return {
      organization,
      profile,
      settings: settings
        ? {
            policyVersion: settings.sourceVersion ?? `${settings.id}:v${String(settings.version)}`,
            requireNch2728: settings.requireNch2728,
            requiredResolutionTypes: stringArray(settings.requiredResolutionTypes),
            qualifyingOfficeTypes: stringArray(settings.qualifyingOfficeTypes),
            expirationWarningDays: numberArray(settings.expirationWarningDays),
            undatedRecordTreatment: settings.undatedRecordTreatment,
          }
        : defaultUnvalidatedSettings(),
      accreditations,
      certifications,
      offices,
      representatives: representatives.map((record) => ({
        ...record,
        status: record.active ? 'ACTIVE' : 'INACTIVE',
      })),
      resolutions: resolutions.map(({ supersededBy, ...record }) => ({
        ...record,
        superseded: record.status === 'SUPERSEDED' || supersededBy.length > 0,
      })),
    };
  }
}

function stringArray(value: Prisma.JsonValue): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function numberArray(value: Prisma.JsonValue): number[] {
  return Array.isArray(value)
    ? value.filter(
        (item): item is number => typeof item === 'number' && Number.isInteger(item) && item >= 0,
      )
    : [];
}

function defaultUnvalidatedSettings(): OtecReadinessSnapshot['settings'] {
  return {
    policyVersion: 'DEFAULT_UNVALIDATED_V1',
    requireNch2728: false,
    requiredResolutionTypes: [],
    qualifyingOfficeTypes: [],
    expirationWarningDays: [7, 15, 30, 60],
    undatedRecordTreatment: 'WARNING',
  };
}
