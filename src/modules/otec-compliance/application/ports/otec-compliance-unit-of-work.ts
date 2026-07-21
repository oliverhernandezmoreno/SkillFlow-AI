import type { AuditLogger } from '../../../../shared/application/audit-logger.js';
import type {
  TransactionManager,
  UnitOfWork,
} from '../../../../shared/application/unit-of-work.js';
import type {
  LegalRepresentativeRepository,
  OtecAccreditationRepository,
  OtecOfficeRepository,
  OtecResolutionRepository,
  QualityCertificationRepository,
} from '../../domain/repositories/otec-regulatory-record.repositories.js';
import type { OtecProfileRepository } from '../../domain/repositories/otec-profile.repository.js';
import type { TenantDocumentOwnershipPort } from './compliance-reference.ports.js';

export interface OtecComplianceUnitOfWork extends UnitOfWork {
  readonly otecAccreditationRepository: OtecAccreditationRepository;
  readonly otecProfileRepository: OtecProfileRepository;
  readonly qualityCertificationRepository: QualityCertificationRepository;
  readonly otecOfficeRepository: OtecOfficeRepository;
  readonly legalRepresentativeRepository: LegalRepresentativeRepository;
  readonly otecResolutionRepository: OtecResolutionRepository;
  readonly documentOwnership: TenantDocumentOwnershipPort;
  readonly auditLogger: AuditLogger;
}

export type OtecComplianceTransactionManager = TransactionManager<OtecComplianceUnitOfWork>;
