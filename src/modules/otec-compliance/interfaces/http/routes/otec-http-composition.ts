import type { PaginatedResult } from '../../../../../shared/application/pagination.js';
import { ModuleEntitlementService } from '../../../application/services/module-entitlement.service.js';
import { OtecComplianceAuthorizationPolicy } from '../../../application/services/otec-compliance-authorization.policy.js';
import { CreateLegalRepresentativeUseCase } from '../../../application/use-cases/create-legal-representative.use-case.js';
import { CreateOtecAccreditationUseCase } from '../../../application/use-cases/create-otec-accreditation.use-case.js';
import { CreateOtecOfficeUseCase } from '../../../application/use-cases/create-otec-office.use-case.js';
import { CreateOtecProfileUseCase } from '../../../application/use-cases/create-otec-profile.use-case.js';
import { CreateOtecResolutionUseCase } from '../../../application/use-cases/create-otec-resolution.use-case.js';
import { CreateQualityCertificationUseCase } from '../../../application/use-cases/create-quality-certification.use-case.js';
import { DeactivateLegalRepresentativeUseCase } from '../../../application/use-cases/deactivate-legal-representative.use-case.js';
import { DeactivateOtecOfficeUseCase } from '../../../application/use-cases/deactivate-otec-office.use-case.js';
import { DeactivateOtecProfileUseCase } from '../../../application/use-cases/deactivate-otec-profile.use-case.js';
import { DeactivateOtecResolutionUseCase } from '../../../application/use-cases/deactivate-otec-resolution.use-case.js';
import { DeactivateQualityCertificationUseCase } from '../../../application/use-cases/deactivate-quality-certification.use-case.js';
import { EvaluateOtecReadinessUseCase } from '../../../application/use-cases/evaluate-otec-readiness.use-case.js';
import { GetExpiringComplianceItemsUseCase } from '../../../application/use-cases/get-expiring-compliance-items.use-case.js';
import { GetLegalRepresentativeUseCase } from '../../../application/use-cases/get-legal-representative.use-case.js';
import { GetOtecAccreditationUseCase } from '../../../application/use-cases/get-otec-accreditation.use-case.js';
import { GetOtecComplianceSummaryUseCase } from '../../../application/use-cases/get-otec-compliance-summary.use-case.js';
import { GetOtecOfficeUseCase } from '../../../application/use-cases/get-otec-office.use-case.js';
import { GetOtecProfileUseCase } from '../../../application/use-cases/get-otec-profile.use-case.js';
import { GetOtecResolutionUseCase } from '../../../application/use-cases/get-otec-resolution.use-case.js';
import { GetQualityCertificationUseCase } from '../../../application/use-cases/get-quality-certification.use-case.js';
import { ListLegalRepresentativesUseCase } from '../../../application/use-cases/list-legal-representatives.use-case.js';
import { ListOtecAccreditationsUseCase } from '../../../application/use-cases/list-otec-accreditations.use-case.js';
import { ListOtecOfficesUseCase } from '../../../application/use-cases/list-otec-offices.use-case.js';
import { ListOtecResolutionsUseCase } from '../../../application/use-cases/list-otec-resolutions.use-case.js';
import { ListQualityCertificationsUseCase } from '../../../application/use-cases/list-quality-certifications.use-case.js';
import { RevokeOtecAccreditationUseCase } from '../../../application/use-cases/revoke-otec-accreditation.use-case.js';
import { SupersedeOtecResolutionUseCase } from '../../../application/use-cases/supersede-otec-resolution.use-case.js';
import { SuspendOtecAccreditationUseCase } from '../../../application/use-cases/suspend-otec-accreditation.use-case.js';
import { UpdateLegalRepresentativeUseCase } from '../../../application/use-cases/update-legal-representative.use-case.js';
import { UpdateOtecAccreditationUseCase } from '../../../application/use-cases/update-otec-accreditation.use-case.js';
import { UpdateOtecOfficeUseCase } from '../../../application/use-cases/update-otec-office.use-case.js';
import { UpdateOtecProfileUseCase } from '../../../application/use-cases/update-otec-profile.use-case.js';
import { UpdateOtecResolutionUseCase } from '../../../application/use-cases/update-otec-resolution.use-case.js';
import { UpdateQualityCertificationUseCase } from '../../../application/use-cases/update-quality-certification.use-case.js';
import { PrismaModuleEntitlementRepository } from '../../../infrastructure/prisma/prisma-module-entitlement.repository.js';
import { PrismaOrganizationComplianceReadAdapter } from '../../../infrastructure/prisma/prisma-compliance-reference.adapters.js';
import { PrismaOtecComplianceTransactionManager } from '../../../infrastructure/prisma/prisma-otec-compliance-transaction-manager.js';
import { PrismaOtecProfileRepository } from '../../../infrastructure/prisma/prisma-otec-profile.repository.js';
import { PrismaOtecReadinessSnapshotAdapter } from '../../../infrastructure/prisma/prisma-otec-readiness-snapshot.adapter.js';
import {
  PrismaOtecAccreditationRepository,
  PrismaQualityCertificationRepository,
} from '../../../infrastructure/prisma/prisma-otec-regulatory-record.repositories.js';
import { LegalRepresentativeController } from '../controllers/legal-representative.controller.js';
import { OtecAccreditationController } from '../controllers/otec-accreditation.controller.js';
import { OtecComplianceQueryController } from '../controllers/otec-compliance-query.controller.js';
import { OtecOfficeController } from '../controllers/otec-office.controller.js';
import { OtecProfileController } from '../controllers/otec-profile.controller.js';
import type { OtecHttpResource } from '../controllers/otec-record.controller.js';
import { OtecResolutionController } from '../controllers/otec-resolution.controller.js';
import { QualityCertificationController } from '../controllers/quality-certification.controller.js';

type Input = Record<string, unknown>;

export function createOtecComplianceControllers() {
  const tx = new PrismaOtecComplianceTransactionManager();
  const access = new ModuleEntitlementService(new PrismaModuleEntitlementRepository());
  const authorization = new OtecComplianceAuthorizationPolicy(access);
  const profileRepository = new PrismaOtecProfileRepository();
  const accreditationRepository = new PrismaOtecAccreditationRepository();
  const certificationRepository = new PrismaQualityCertificationRepository();
  const snapshots = new PrismaOtecReadinessSnapshotAdapter();

  const createProfile = new CreateOtecProfileUseCase(
    tx,
    new PrismaOrganizationComplianceReadAdapter(),
    authorization,
  );
  const getProfile = new GetOtecProfileUseCase(profileRepository, authorization);
  const updateProfile = new UpdateOtecProfileUseCase(tx, authorization);
  const deactivateProfile = new DeactivateOtecProfileUseCase(tx, authorization);

  const createAccreditation = new CreateOtecAccreditationUseCase(tx, access);
  const listAccreditations = new ListOtecAccreditationsUseCase(accreditationRepository, access);
  const getAccreditation = new GetOtecAccreditationUseCase(accreditationRepository, access);
  const updateAccreditation = new UpdateOtecAccreditationUseCase(tx, access);
  const suspendAccreditation = new SuspendOtecAccreditationUseCase(tx, access);
  const revokeAccreditation = new RevokeOtecAccreditationUseCase(tx, access);

  const createCertification = new CreateQualityCertificationUseCase(tx, access);
  const listCertifications = new ListQualityCertificationsUseCase(certificationRepository, access);
  const getCertification = new GetQualityCertificationUseCase(certificationRepository, access);
  const updateCertification = new UpdateQualityCertificationUseCase(tx, access);
  const deactivateCertification = new DeactivateQualityCertificationUseCase(tx, access);

  const createOffice = new CreateOtecOfficeUseCase(tx, access);
  const listOffices = new ListOtecOfficesUseCase(tx, access);
  const getOffice = new GetOtecOfficeUseCase(tx, access);
  const updateOffice = new UpdateOtecOfficeUseCase(tx, access);
  const deactivateOffice = new DeactivateOtecOfficeUseCase(tx, access);

  const createRepresentative = new CreateLegalRepresentativeUseCase(tx, access);
  const listRepresentatives = new ListLegalRepresentativesUseCase(tx, access);
  const getRepresentative = new GetLegalRepresentativeUseCase(tx, access);
  const updateRepresentative = new UpdateLegalRepresentativeUseCase(tx, access);
  const deactivateRepresentative = new DeactivateLegalRepresentativeUseCase(tx, access);

  const createResolution = new CreateOtecResolutionUseCase(tx, access);
  const listResolutions = new ListOtecResolutionsUseCase(tx, access);
  const getResolution = new GetOtecResolutionUseCase(tx, access);
  const updateResolution = new UpdateOtecResolutionUseCase(tx, access);
  const deactivateResolution = new DeactivateOtecResolutionUseCase(tx, access);
  const supersedeResolution = new SupersedeOtecResolutionUseCase(tx, access);

  const readiness = new EvaluateOtecReadinessUseCase(snapshots, access);
  const summary = new GetOtecComplianceSummaryUseCase(readiness);
  const expiring = new GetExpiringComplianceItemsUseCase(snapshots, access);

  return {
    profile: new OtecProfileController({
      create: createProfile,
      get: getProfile,
      update: updateProfile,
      deactivate: deactivateProfile,
    }),
    accreditation: new OtecAccreditationController({
      create: async (value, context) => resource(await createAccreditation.execute(input(value), context)),
      list: async (filters, pagination, context) =>
        page(await listAccreditations.execute(input(filters), pagination, context)),
      get: async (id, context) => resource(await getAccreditation.execute(id, context)),
      update: async (id, value, context) =>
        resource(await updateAccreditation.execute(id, input(value), context)),
      suspend: async (id, value, context) =>
        resource(await suspendAccreditation.execute(id, input(value), context)),
      revoke: async (id, value, context) =>
        resource(await revokeAccreditation.execute(id, input(value), context)),
      mapFilters: (query) => pick(query, ['status', 'validAt', 'validUntilBefore']),
    }),
    certification: new QualityCertificationController({
      create: async (value, context) => resource(await createCertification.execute(input(value), context)),
      list: async (filters, pagination, context) =>
        page(await listCertifications.execute(input(filters), pagination, context)),
      get: async (id, context) => resource(await getCertification.execute(id, context)),
      update: async (id, value, context) =>
        resource(await updateCertification.execute(id, input(value), context)),
      deactivate: async (id, value, context) =>
        resource(await deactivateCertification.execute(id, input(value), context)),
      mapFilters: (query) => ({
        ...pick(query, ['status', 'validAt', 'validUntilFrom', 'validUntilBefore']),
        ...(query['type'] === undefined ? {} : { certificationType: query['type'] }),
      }),
    }),
    office: new OtecOfficeController({
      create: async (value, context) => resource(await createOffice.execute(input(value), context)),
      list: async (filters, pagination, context) =>
        page(await listOffices.execute(input(filters), pagination, context)),
      get: async (id, context) => resource(await getOffice.execute(id, context)),
      update: async (id, value, context) =>
        resource(await updateOffice.execute(id, input(value), context)),
      deactivate: async (id, value, context) =>
        resource(await deactivateOffice.execute(id, input(value), context)),
      mapFilters: (query) => ({
        ...pick(query, ['status', 'validAt', 'validUntilFrom', 'validUntilBefore']),
        ...(query['type'] === undefined ? {} : { officeType: query['type'] }),
      }),
    }),
    representative: new LegalRepresentativeController({
      create: async (value, context) => resource(await createRepresentative.execute(input(value), context)),
      list: async (filters, pagination, context) =>
        page(await listRepresentatives.execute(input(filters), pagination, context)),
      get: async (id, context) => resource(await getRepresentative.execute(id, context)),
      update: async (id, value, context) =>
        resource(await updateRepresentative.execute(id, input(value), context)),
      deactivate: async (id, value, context) =>
        resource(await deactivateRepresentative.execute(id, input(value), context)),
      mapFilters: (query) => pick(query, ['status', 'validAt', 'validUntilBefore']),
    }),
    resolution: new OtecResolutionController({
      create: async (value, context) => resource(await createResolution.execute(input(value), context)),
      list: async (filters, pagination, context) =>
        page(await listResolutions.execute(input(filters), pagination, context)),
      get: async (id, context) => resource(await getResolution.execute(id, context)),
      update: async (id, value, context) =>
        resource(await updateResolution.execute(id, input(value), context)),
      deactivate: async (id, value, context) =>
        resource(await deactivateResolution.execute(id, input(value), context)),
      supersede: async (value, context) => {
        const result = await supersedeResolution.execute(input(value), context);
        return {
          response: result as unknown as Input,
          version: result.replacement.version,
        };
      },
      mapFilters: (query) => ({
        ...pick(query, [
          'status',
          'otecProfileId',
          'validAt',
          'validFromAfter',
          'validUntilBefore',
        ]),
        ...(query['type'] === undefined ? {} : { resolutionType: query['type'] }),
      }),
    }),
    query: new OtecComplianceQueryController({
      evaluate: async (value, context) =>
        (await readiness.execute(input(value), context)) as unknown as Input,
      summary: async (value, context) =>
        (await summary.execute(input(value), context)) as unknown as Input,
      expiring: async (value, pagination, context) =>
        (await expiring.execute(input(value), pagination, context)) as unknown as PaginatedResult<Input>,
    }),
    access,
  };
}

// The composition root is the typed boundary between transport records and use-case DTOs.
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
function input<T>(value: Input): T {
  return value as unknown as T;
}

function resource(value: { version: number }): OtecHttpResource {
  return value;
}

function page<T extends { version: number }>(value: PaginatedResult<T>): PaginatedResult<OtecHttpResource> {
  return value;
}

function pick(value: Input, keys: readonly string[]): Input {
  return Object.fromEntries(keys.flatMap((key) => (value[key] === undefined ? [] : [[key, value[key]]])));
}
