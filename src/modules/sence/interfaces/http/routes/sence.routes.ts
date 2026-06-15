import { Router } from 'express';

import { PrismaAuditLogger } from '../../../../../shared/infrastructure/prisma/prisma-audit-logger.js';
import { validateBody } from '../../../../../shared/interfaces/http/validate-request.js';
import { JwtTokenService } from '../../../../auth/infrastructure/services/jwt-token.service.js';
import { requireAuth } from '../../../../auth/interfaces/http/middlewares/require-auth.middleware.js';
import { requirePermission } from '../../../../auth/interfaces/http/middlewares/require-permission.middleware.js';
import { AttachSenceDocumentUseCase } from '../../../application/use-cases/attach-sence-document.use-case.js';
import { BuildSenceEvidenceUseCase } from '../../../application/use-cases/build-sence-evidence.use-case.js';
import { CreateSenceDeclarationUseCase } from '../../../application/use-cases/create-sence-declaration.use-case.js';
import { GetSenceDeclarationByTrainingSessionUseCase } from '../../../application/use-cases/get-sence-declaration-by-training-session.use-case.js';
import { GetSenceDeclarationUseCase } from '../../../application/use-cases/get-sence-declaration.use-case.js';
import { ListSenceDeclarationsUseCase } from '../../../application/use-cases/list-sence-declarations.use-case.js';
import { ListSenceDocumentsUseCase } from '../../../application/use-cases/list-sence-documents.use-case.js';
import { MarkSenceDeclarationReadyUseCase } from '../../../application/use-cases/mark-sence-declaration-ready.use-case.js';
import { SubmitSenceDeclarationUseCase } from '../../../application/use-cases/submit-sence-declaration.use-case.js';
import { UpdateSenceDeclarationStatusUseCase } from '../../../application/use-cases/update-sence-declaration-status.use-case.js';
import { UpdateSenceDeclarationUseCase } from '../../../application/use-cases/update-sence-declaration.use-case.js';
import { ValidateSenceComplianceUseCase } from '../../../application/use-cases/validate-sence-compliance.use-case.js';
import { PrismaSenceRepository } from '../../../infrastructure/prisma/prisma-sence.repository.js';
import { SenceController } from '../controllers/sence.controller.js';
import {
  attachSenceDocumentSchema,
  createSenceDeclarationSchema,
  submitSenceDeclarationSchema,
  updateSenceDeclarationSchema,
  updateSenceStatusSchema,
} from '../validators/sence.validators.js';

export function createSenceRouter(): Router {
  const router = Router();
  const repository = new PrismaSenceRepository();
  const auditLogger = new PrismaAuditLogger();
  const tokenService = new JwtTokenService();
  const controller = new SenceController(
    new ListSenceDeclarationsUseCase(repository),
    new GetSenceDeclarationUseCase(repository),
    new CreateSenceDeclarationUseCase(repository, auditLogger),
    new UpdateSenceDeclarationUseCase(repository, auditLogger),
    new ValidateSenceComplianceUseCase(repository, undefined, auditLogger),
    new BuildSenceEvidenceUseCase(repository, undefined, auditLogger),
    new MarkSenceDeclarationReadyUseCase(repository, undefined, auditLogger),
    new SubmitSenceDeclarationUseCase(repository, auditLogger),
    new UpdateSenceDeclarationStatusUseCase(repository, auditLogger),
    new AttachSenceDocumentUseCase(repository, auditLogger),
    new ListSenceDocumentsUseCase(repository),
    new GetSenceDeclarationByTrainingSessionUseCase(repository),
  );

  router.use(requireAuth(tokenService));
  router.get('/sence/declarations', requirePermission('sence.read'), controller.list);
  router.post(
    '/sence/declarations',
    requirePermission('sence.create'),
    validateBody(createSenceDeclarationSchema),
    controller.create,
  );
  router.get('/sence/declarations/:declarationId', requirePermission('sence.read'), controller.get);
  router.put(
    '/sence/declarations/:declarationId',
    requirePermission('sence.update'),
    validateBody(updateSenceDeclarationSchema),
    controller.update,
  );
  router.post(
    '/sence/declarations/:declarationId/validate',
    requirePermission('sence.validate'),
    controller.validate,
  );
  router.post(
    '/sence/declarations/:declarationId/evidence',
    requirePermission('sence.evidence'),
    controller.evidence,
  );
  router.post(
    '/sence/declarations/:declarationId/ready',
    requirePermission('sence.ready'),
    controller.ready,
  );
  router.post(
    '/sence/declarations/:declarationId/submit',
    requirePermission('sence.submit'),
    validateBody(submitSenceDeclarationSchema),
    controller.submit,
  );
  router.post(
    '/sence/declarations/:declarationId/status',
    requirePermission('sence.status'),
    validateBody(updateSenceStatusSchema),
    controller.status,
  );
  router.post(
    '/sence/declarations/:declarationId/documents',
    requirePermission('sence.documents'),
    validateBody(attachSenceDocumentSchema),
    controller.attachDocument,
  );
  router.get(
    '/sence/declarations/:declarationId/documents',
    requirePermission('sence.documents'),
    controller.listDocuments,
  );
  router.get(
    '/training-sessions/:trainingSessionId/sence/declaration',
    requirePermission('sence.read'),
    controller.getByTrainingSession,
  );

  return router;
}
