import { Router } from 'express';

import { PrismaAuditLogger } from '../../../../../shared/infrastructure/prisma/prisma-audit-logger.js';
import { validateBody } from '../../../../../shared/interfaces/http/validate-request.js';
import { JwtTokenService } from '../../../../auth/infrastructure/services/jwt-token.service.js';
import { requireAuth } from '../../../../auth/interfaces/http/middlewares/require-auth.middleware.js';
import { requirePermission } from '../../../../auth/interfaces/http/middlewares/require-permission.middleware.js';
import { CheckCertificateEligibilityUseCase } from '../../../application/use-cases/check-certificate-eligibility.use-case.js';
import { GenerateCertificateDocumentUseCase } from '../../../application/use-cases/generate-certificate-document.use-case.js';
import { GetCertificateUseCase } from '../../../application/use-cases/get-certificate.use-case.js';
import { IssueCertificateUseCase } from '../../../application/use-cases/issue-certificate.use-case.js';
import { ListCertificatesUseCase } from '../../../application/use-cases/list-certificates.use-case.js';
import { ListEmployeeCertificatesUseCase } from '../../../application/use-cases/list-employee-certificates.use-case.js';
import { ListEnrollmentCertificatesUseCase } from '../../../application/use-cases/list-enrollment-certificates.use-case.js';
import { RevokeCertificateUseCase } from '../../../application/use-cases/revoke-certificate.use-case.js';
import { VerifyCertificateUseCase } from '../../../application/use-cases/verify-certificate.use-case.js';
import { PrismaCertificateRepository } from '../../../infrastructure/prisma/prisma-certificate.repository.js';
import { CertificateController } from '../controllers/certificate.controller.js';
import {
  certificateEligibilitySchema,
  issueCertificateSchema,
  revokeCertificateSchema,
} from '../validators/certificate.validators.js';

export function createCertificateRouter(): Router {
  const router = Router();
  const repository = new PrismaCertificateRepository();
  const auditLogger = new PrismaAuditLogger();
  const tokenService = new JwtTokenService();
  const controller = new CertificateController(
    new ListCertificatesUseCase(repository),
    new GetCertificateUseCase(repository),
    new CheckCertificateEligibilityUseCase(repository, undefined, auditLogger),
    new IssueCertificateUseCase(repository, auditLogger),
    new RevokeCertificateUseCase(repository, auditLogger),
    new ListEmployeeCertificatesUseCase(repository),
    new ListEnrollmentCertificatesUseCase(repository),
    new VerifyCertificateUseCase(repository, auditLogger),
    new GenerateCertificateDocumentUseCase(repository, auditLogger),
  );

  router.get('/certificates/verify/:verificationCode', controller.verify);

  router.use(requireAuth(tokenService));
  router.get('/certificates', requirePermission('certificates.read'), controller.list);
  router.get('/certificates/:certificateId', requirePermission('certificates.read'), controller.get);
  router.post(
    '/certificates/eligibility',
    requirePermission('certificates.issue'),
    validateBody(certificateEligibilitySchema),
    controller.eligibility,
  );
  router.post(
    '/certificates',
    requirePermission('certificates.issue'),
    validateBody(issueCertificateSchema),
    controller.issue,
  );
  router.post(
    '/certificates/:certificateId/revoke',
    requirePermission('certificates.revoke'),
    validateBody(revokeCertificateSchema),
    controller.revoke,
  );
  router.get(
    '/employees/:employeeId/certificates',
    requirePermission('certificates.read'),
    controller.listByEmployee,
  );
  router.get(
    '/enrollments/:enrollmentId/certificates',
    requirePermission('certificates.read'),
    controller.listByEnrollment,
  );
  router.post(
    '/certificates/:certificateId/document',
    requirePermission('certificates.document'),
    controller.generateDocument,
  );

  return router;
}
