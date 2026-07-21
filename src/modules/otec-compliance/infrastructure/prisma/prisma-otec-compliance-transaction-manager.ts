import type { PrismaClient } from '@prisma/client';

import { prismaClient } from '../../../../infrastructure/prisma/prisma-client.js';
import { PrismaAuditLogger } from '../../../../shared/infrastructure/prisma/prisma-audit-logger.js';
import type {
  OtecComplianceTransactionManager,
  OtecComplianceUnitOfWork,
} from '../../application/ports/otec-compliance-unit-of-work.js';
import {
  PrismaLegalRepresentativeRepository,
  PrismaOtecAccreditationRepository,
  PrismaOtecOfficeRepository,
  PrismaOtecResolutionRepository,
  PrismaQualityCertificationRepository,
} from './prisma-otec-regulatory-record.repositories.js';
import { PrismaOtecProfileRepository } from './prisma-otec-profile.repository.js';
import { PrismaTenantDocumentOwnershipAdapter } from './prisma-compliance-reference.adapters.js';

export class PrismaOtecComplianceTransactionManager implements OtecComplianceTransactionManager {
  constructor(private readonly prisma: PrismaClient = prismaClient) {}

  async run<TResult>(
    work: (unitOfWork: OtecComplianceUnitOfWork) => Promise<TResult>,
  ): Promise<TResult> {
    return this.prisma.$transaction(async (transaction) =>
      work({
        transactionBoundary: 'UNIT_OF_WORK',
        otecAccreditationRepository: new PrismaOtecAccreditationRepository(transaction),
        otecProfileRepository: new PrismaOtecProfileRepository(transaction),
        qualityCertificationRepository: new PrismaQualityCertificationRepository(transaction),
        otecOfficeRepository: new PrismaOtecOfficeRepository(transaction),
        legalRepresentativeRepository: new PrismaLegalRepresentativeRepository(transaction),
        otecResolutionRepository: new PrismaOtecResolutionRepository(transaction),
        documentOwnership: new PrismaTenantDocumentOwnershipAdapter(transaction),
        auditLogger: new PrismaAuditLogger(transaction),
      }),
    );
  }
}
