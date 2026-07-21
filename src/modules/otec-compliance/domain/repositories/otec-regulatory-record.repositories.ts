import type {
  PaginatedResult,
  PaginationInput,
} from '../../../../shared/application/pagination.js';
import type {
  OtecAccreditation,
  OtecAccreditationStatus,
} from '../entities/otec-accreditation.entity.js';
import type { LegalRepresentative } from '../entities/legal-representative.entity.js';
import type {
  OtecOffice,
  OtecOfficeStatus,
  OtecOfficeType,
} from '../entities/otec-office.entity.js';
import type { OtecResolution, OtecResolutionStatus } from '../entities/otec-resolution.entity.js';
import type {
  QualityCertification,
  QualityCertificationStatus,
  QualityCertificationType,
} from '../entities/quality-certification.entity.js';

export interface EffectiveRecordFilters<TStatus extends string> {
  status?: TStatus | undefined;
  validUntilBefore?: Date | undefined;
  validAt?: Date | undefined;
}

export interface QualityCertificationFilters extends EffectiveRecordFilters<QualityCertificationStatus> {
  certificationType?: QualityCertificationType | undefined;
  validUntilFrom?: Date | undefined;
}
export interface OtecOfficeFilters extends EffectiveRecordFilters<OtecOfficeStatus> {
  officeType?: OtecOfficeType | undefined;
  validUntilFrom?: Date | undefined;
}

export interface TenantRecordRepository<TEntity, TFilters> {
  findById(organizationId: string, id: string): Promise<TEntity | null>;
  search(
    organizationId: string,
    filters: TFilters,
    pagination: PaginationInput,
  ): Promise<PaginatedResult<TEntity>>;
  save(entity: TEntity): Promise<void>;
  update(entity: TEntity, expectedVersion: number): Promise<void>;
}

export type OtecAccreditationRepository = TenantRecordRepository<
  OtecAccreditation,
  EffectiveRecordFilters<OtecAccreditationStatus>
>;

export type QualityCertificationRepository = TenantRecordRepository<
  QualityCertification,
  QualityCertificationFilters
>;

export type OtecOfficeRepository = TenantRecordRepository<OtecOffice, OtecOfficeFilters>;

export type LegalRepresentativeRepository = TenantRecordRepository<
  LegalRepresentative,
  LegalRepresentativeFilters
>;
export type LegalRepresentativeFilters = EffectiveRecordFilters<'ACTIVE' | 'INACTIVE'>;

export interface OtecResolutionRepository extends TenantRecordRepository<
  OtecResolution,
  OtecResolutionFilters
> {
  supersede(
    replacement: OtecResolution,
    replaced: OtecResolution,
    replacementExpectedVersion: number,
    replacedExpectedVersion: number,
  ): Promise<void>;
}
export interface OtecResolutionFilters extends EffectiveRecordFilters<OtecResolutionStatus> {
  otecProfileId?: string;
  resolutionType?: import('../entities/otec-resolution.entity.js').OtecResolutionType;
  validFromAfter?: Date;
}
