import { Router } from 'express';

import { validateBody } from '../../../../../shared/interfaces/http/validate-request.js';
import { requireAuth } from '../../../../auth/interfaces/http/middlewares/require-auth.middleware.js';
import { requirePermission } from '../../../../auth/interfaces/http/middlewares/require-permission.middleware.js';
import { JwtTokenService } from '../../../../auth/infrastructure/services/jwt-token.service.js';
import { PrismaAuditLogger } from '../../../../../shared/infrastructure/prisma/prisma-audit-logger.js';
import { CreateOrganizationUseCase } from '../../../application/use-cases/create-organization.use-case.js';
import { DeactivateOrganizationUseCase } from '../../../application/use-cases/deactivate-organization.use-case.js';
import { GetOrganizationUseCase } from '../../../application/use-cases/get-organization.use-case.js';
import { ListOrganizationsUseCase } from '../../../application/use-cases/list-organizations.use-case.js';
import { UpdateOrganizationUseCase } from '../../../application/use-cases/update-organization.use-case.js';
import { PrismaOrganizationRepository } from '../../../infrastructure/prisma/prisma-organization.repository.js';
import { OrganizationController } from '../controllers/organization.controller.js';
import { createOrganizationSchema, updateOrganizationSchema } from '../validators/organization.validators.js';

export function createOrganizationRouter(): Router {
  const router = Router();
  const repository = new PrismaOrganizationRepository();
  const auditLogger = new PrismaAuditLogger();
  const tokenService = new JwtTokenService();
  const controller = new OrganizationController(
    new ListOrganizationsUseCase(repository),
    new CreateOrganizationUseCase(repository, auditLogger),
    new GetOrganizationUseCase(repository),
    new UpdateOrganizationUseCase(repository, auditLogger),
    new DeactivateOrganizationUseCase(repository, auditLogger),
  );

  router.use('/organizations', requireAuth(tokenService));
  router.get('/organizations', requirePermission('organizations:read'), controller.list);
  router.post(
    '/organizations',
    requirePermission('organizations:create'),
    validateBody(createOrganizationSchema),
    controller.create,
  );
  router.get(
    '/organizations/:organizationId',
    requirePermission('organizations:read'),
    controller.get,
  );
  router.put(
    '/organizations/:organizationId',
    requirePermission('organizations:update'),
    validateBody(updateOrganizationSchema),
    controller.update,
  );
  router.patch(
    '/organizations/:organizationId',
    requirePermission('organizations:update'),
    validateBody(updateOrganizationSchema),
    controller.update,
  );
  router.delete(
    '/organizations/:organizationId',
    requirePermission('organizations:delete'),
    controller.deactivate,
  );

  return router;
}
