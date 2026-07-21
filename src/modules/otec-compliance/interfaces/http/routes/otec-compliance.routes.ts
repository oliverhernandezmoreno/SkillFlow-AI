import { Router } from 'express';
import { z } from 'zod';

import type { TokenService } from '../../../../auth/domain/services/token-service.js';
import { JwtTokenService } from '../../../../auth/infrastructure/services/jwt-token.service.js';
import { requireAuth } from '../../../../auth/interfaces/http/middlewares/require-auth.middleware.js';
import { requirePermission } from '../../../../auth/interfaces/http/middlewares/require-permission.middleware.js';
import { asyncHandler } from '../../../../../shared/interfaces/http/async-handler.js';
import {
  accreditationListQuerySchema,
  certificationListQuerySchema,
  createAccreditationBodySchema,
  createCertificationBodySchema,
  createOfficeBodySchema,
  createProfileBodySchema,
  createRepresentativeBodySchema,
  createResolutionBodySchema,
  expiringItemsQuerySchema,
  idParamsSchema,
  officeListQuerySchema,
  profileIdQuerySchema,
  readinessBodySchema,
  representativeListQuerySchema,
  resolutionListQuerySchema,
  supersessionBodySchema,
  transitionBodySchema,
  updateAccreditationBodySchema,
  updateCertificationBodySchema,
  updateOfficeBodySchema,
  updateProfileBodySchema,
  updateRepresentativeBodySchema,
  updateResolutionBodySchema,
} from '../contracts/otec-http-schemas.js';
import { otecHttpErrorHandler } from '../middlewares/otec-http-error.middleware.js';
import { requireModuleEntitlement } from '../middlewares/require-module-entitlement.middleware.js';
import {
  validateOtecBody,
  validateOtecParams,
  validateOtecQuery,
} from '../middlewares/validate-otec-request.middleware.js';
import { createOtecComplianceControllers } from './otec-http-composition.js';

type Composition = ReturnType<typeof createOtecComplianceControllers>;
type Controllers = Omit<Composition, 'access'>;
type ModuleAccessEvaluator = Parameters<typeof requireModuleEntitlement>[0];

export interface OtecComplianceRouterOptions {
  controllers?: Controllers;
  access?: ModuleAccessEvaluator;
  tokenService?: TokenService;
}

const emptyQuery = z.object({}).strict();

export function createOtecComplianceRouter(options: OtecComplianceRouterOptions = {}): Router {
  const router = Router();
  const production = options.controllers && options.access ? null : createOtecComplianceControllers();
  const controllers = options.controllers ?? controllersFrom(required(production));
  const access = options.access ?? required(production).access;
  const tokenService = options.tokenService ?? new JwtTokenService();

  router.use('/otec-compliance', requireAuth(tokenService));

  router.get(
    '/otec-compliance/profile',
    entitlement(access, 'profile'),
    requirePermission('otec_compliance.read'),
    validateOtecQuery(emptyQuery),
    controllers.profile.get,
  );
  router.post(
    '/otec-compliance/profile',
    entitlement(access, 'profile'),
    requirePermission('otec_compliance.profile.manage'),
    validateOtecBody(createProfileBodySchema),
    controllers.profile.create,
  );
  router.patch(
    '/otec-compliance/profile',
    entitlement(access, 'profile'),
    requirePermission('otec_compliance.profile.manage'),
    validateOtecBody(updateProfileBodySchema),
    controllers.profile.update,
  );
  router.post(
    '/otec-compliance/profile/deactivation',
    entitlement(access, 'profile'),
    requirePermission('otec_compliance.profile.manage'),
    validateOtecBody(transitionBodySchema),
    controllers.profile.deactivate,
  );

  registerAccreditationRoutes(router, controllers, access);
  registerCertificationRoutes(router, controllers, access);
  registerOfficeRoutes(router, controllers, access);
  registerRepresentativeRoutes(router, controllers, access);
  registerResolutionRoutes(router, controllers, access);

  router.post(
    '/otec-compliance/readiness/evaluations',
    entitlement(access, 'readiness'),
    requirePermission('otec_compliance.readiness.evaluate'),
    validateOtecBody(readinessBodySchema),
    controllers.query.evaluate,
  );
  router.get(
    '/otec-compliance/compliance-summary',
    entitlement(access, 'readiness'),
    requirePermission('otec_compliance.read'),
    validateOtecQuery(profileIdQuerySchema),
    controllers.query.summary,
  );
  router.get(
    '/otec-compliance/expiring-items',
    entitlement(access, 'expirations'),
    requirePermission('otec_compliance.read'),
    validateOtecQuery(expiringItemsQuerySchema),
    controllers.query.expiring,
  );

  router.use(otecHttpErrorHandler);
  return router;
}

function registerAccreditationRoutes(router: Router, controllers: Controllers, access: ModuleAccessEvaluator): void {
  const base = '/otec-compliance/accreditations';
  router.get(base, entitlement(access, 'accreditations'), read(), validateOtecQuery(accreditationListQuerySchema), controllers.accreditation.list);
  router.post(base, entitlement(access, 'accreditations'), manage('accreditation'), validateOtecBody(createAccreditationBodySchema), controllers.accreditation.create);
  router.get(`${base}/:id`, entitlement(access, 'accreditations'), read(), validateOtecParams(idParamsSchema), controllers.accreditation.get);
  router.patch(`${base}/:id`, entitlement(access, 'accreditations'), manage('accreditation'), validateOtecParams(idParamsSchema), validateOtecBody(updateAccreditationBodySchema), controllers.accreditation.update);
  router.post(`${base}/:id/suspension`, entitlement(access, 'accreditations'), manage('accreditation'), validateOtecParams(idParamsSchema), validateOtecBody(transitionBodySchema), controllers.accreditation.suspend);
  router.post(`${base}/:id/revocation`, entitlement(access, 'accreditations'), manage('accreditation'), validateOtecParams(idParamsSchema), validateOtecBody(transitionBodySchema), controllers.accreditation.revoke);
}

function registerCertificationRoutes(router: Router, controllers: Controllers, access: ModuleAccessEvaluator): void {
  const base = '/otec-compliance/quality-certifications';
  router.get(base, entitlement(access, 'certifications'), read(), validateOtecQuery(certificationListQuerySchema), controllers.certification.list);
  router.post(base, entitlement(access, 'certifications'), manage('certification'), validateOtecBody(createCertificationBodySchema), controllers.certification.create);
  router.get(`${base}/:id`, entitlement(access, 'certifications'), read(), validateOtecParams(idParamsSchema), controllers.certification.get);
  router.patch(`${base}/:id`, entitlement(access, 'certifications'), manage('certification'), validateOtecParams(idParamsSchema), validateOtecBody(updateCertificationBodySchema), controllers.certification.update);
  router.post(`${base}/:id/deactivation`, entitlement(access, 'certifications'), manage('certification'), validateOtecParams(idParamsSchema), validateOtecBody(transitionBodySchema), controllers.certification.deactivate);
}

function registerOfficeRoutes(router: Router, controllers: Controllers, access: ModuleAccessEvaluator): void {
  const base = '/otec-compliance/offices';
  router.get(base, entitlement(access, 'offices'), read(), validateOtecQuery(officeListQuerySchema), controllers.office.list);
  router.post(base, entitlement(access, 'offices'), manage('office'), validateOtecBody(createOfficeBodySchema), controllers.office.create);
  router.get(`${base}/:id`, entitlement(access, 'offices'), read(), validateOtecParams(idParamsSchema), controllers.office.get);
  router.patch(`${base}/:id`, entitlement(access, 'offices'), manage('office'), validateOtecParams(idParamsSchema), validateOtecBody(updateOfficeBodySchema), controllers.office.update);
  router.post(`${base}/:id/deactivation`, entitlement(access, 'offices'), manage('office'), validateOtecParams(idParamsSchema), validateOtecBody(transitionBodySchema), controllers.office.deactivate);
}

function registerRepresentativeRoutes(router: Router, controllers: Controllers, access: ModuleAccessEvaluator): void {
  const base = '/otec-compliance/legal-representatives';
  router.get(base, entitlement(access, 'representatives'), read(), validateOtecQuery(representativeListQuerySchema), controllers.representative.list);
  router.post(base, entitlement(access, 'representatives'), manage('representative'), validateOtecBody(createRepresentativeBodySchema), controllers.representative.create);
  router.get(`${base}/:id`, entitlement(access, 'representatives'), read(), validateOtecParams(idParamsSchema), controllers.representative.get);
  router.patch(`${base}/:id`, entitlement(access, 'representatives'), manage('representative'), validateOtecParams(idParamsSchema), validateOtecBody(updateRepresentativeBodySchema), controllers.representative.update);
  router.post(`${base}/:id/deactivation`, entitlement(access, 'representatives'), manage('representative'), validateOtecParams(idParamsSchema), validateOtecBody(transitionBodySchema), controllers.representative.deactivate);
}

function registerResolutionRoutes(router: Router, controllers: Controllers, access: ModuleAccessEvaluator): void {
  const base = '/otec-compliance/resolutions';
  router.get(base, entitlement(access, 'resolutions'), read(), validateOtecQuery(resolutionListQuerySchema), controllers.resolution.list);
  router.post(base, entitlement(access, 'resolutions'), manage('resolution'), validateOtecBody(createResolutionBodySchema), controllers.resolution.create);
  router.get(`${base}/:id`, entitlement(access, 'resolutions'), read(), validateOtecParams(idParamsSchema), controllers.resolution.get);
  router.patch(`${base}/:id`, entitlement(access, 'resolutions'), manage('resolution'), validateOtecParams(idParamsSchema), validateOtecBody(updateResolutionBodySchema), controllers.resolution.update);
  router.post(`${base}/:id/supersession`, entitlement(access, 'resolutions'), manage('resolution'), validateOtecParams(idParamsSchema), validateOtecBody(supersessionBodySchema), controllers.resolution.supersede);
  router.post(`${base}/:id/deactivation`, entitlement(access, 'resolutions'), manage('resolution'), validateOtecParams(idParamsSchema), validateOtecBody(transitionBodySchema), controllers.resolution.deactivate);
}

function entitlement(access: ModuleAccessEvaluator, feature: string) {
  return asyncHandler(requireModuleEntitlement(access, feature));
}

function read() {
  return requirePermission('otec_compliance.read');
}

function manage(resource: 'accreditation' | 'certification' | 'office' | 'representative' | 'resolution') {
  return requirePermission(`otec_compliance.${resource}.manage`);
}

function required<T>(value: T | null): T {
  if (!value) throw new Error('OTEC Compliance composition is unavailable');
  return value;
}

function controllersFrom(composition: Composition): Controllers {
  return {
    profile: composition.profile,
    accreditation: composition.accreditation,
    certification: composition.certification,
    office: composition.office,
    representative: composition.representative,
    resolution: composition.resolution,
    query: composition.query,
  };
}
