import type { Request, Response } from 'express';

import type { AuthenticatedLocals } from '../../../../auth/interfaces/http/auth-context.js';
import { createUseCaseContext } from '../../../../auth/interfaces/http/auth-request-context.js';
import { asyncHandler } from '../../../../../shared/interfaces/http/async-handler.js';
import {
  getOptionalQueryNumber,
  getOptionalQueryString,
  getRequiredParam,
} from '../../../../../shared/interfaces/http/request-values.js';
import type {
  IssueCertificateDto,
  RevokeCertificateDto,
} from '../../../application/dto/certificate.dto.js';
import type { CheckCertificateEligibilityUseCase } from '../../../application/use-cases/check-certificate-eligibility.use-case.js';
import type { GenerateCertificateDocumentUseCase } from '../../../application/use-cases/generate-certificate-document.use-case.js';
import type { GetCertificateUseCase } from '../../../application/use-cases/get-certificate.use-case.js';
import type { IssueCertificateUseCase } from '../../../application/use-cases/issue-certificate.use-case.js';
import type { ListCertificatesUseCase } from '../../../application/use-cases/list-certificates.use-case.js';
import type { ListEmployeeCertificatesUseCase } from '../../../application/use-cases/list-employee-certificates.use-case.js';
import type { ListEnrollmentCertificatesUseCase } from '../../../application/use-cases/list-enrollment-certificates.use-case.js';
import type { RevokeCertificateUseCase } from '../../../application/use-cases/revoke-certificate.use-case.js';
import type { VerifyCertificateUseCase } from '../../../application/use-cases/verify-certificate.use-case.js';
import type { CertificateStatus } from '../../../domain/entities/certificate.entity.js';

export class CertificateController {
  constructor(
    private readonly listCertificatesUseCase: ListCertificatesUseCase,
    private readonly getCertificateUseCase: GetCertificateUseCase,
    private readonly checkCertificateEligibilityUseCase: CheckCertificateEligibilityUseCase,
    private readonly issueCertificateUseCase: IssueCertificateUseCase,
    private readonly revokeCertificateUseCase: RevokeCertificateUseCase,
    private readonly listEmployeeCertificatesUseCase: ListEmployeeCertificatesUseCase,
    private readonly listEnrollmentCertificatesUseCase: ListEnrollmentCertificatesUseCase,
    private readonly verifyCertificateUseCase: VerifyCertificateUseCase,
    private readonly generateCertificateDocumentUseCase: GenerateCertificateDocumentUseCase,
  ) {}

  list = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.listCertificatesUseCase.execute(
        {
          page: getOptionalQueryNumber(request, 'page'),
          pageSize: getOptionalQueryNumber(request, 'pageSize'),
          employeeId: getOptionalQueryString(request, 'employeeId'),
          enrollmentId: getOptionalQueryString(request, 'enrollmentId'),
          trainingSessionId: getOptionalQueryString(request, 'trainingSessionId'),
          status: getOptionalQueryString(request, 'status') as CertificateStatus | undefined,
        },
        createUseCaseContext(request, response),
      );
      response.status(200).json(result);
    },
  );

  get = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.getCertificateUseCase.execute(
        getRequiredParam(request, 'certificateId'),
        createUseCaseContext(request, response),
      );
      response.status(200).json(result);
    },
  );

  eligibility = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.checkCertificateEligibilityUseCase.execute(
        request.body as { enrollmentId: string },
        createUseCaseContext(request, response),
      );
      response.status(200).json(result);
    },
  );

  issue = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.issueCertificateUseCase.execute(
        request.body as IssueCertificateDto,
        createUseCaseContext(request, response),
      );
      response.status(201).json(result);
    },
  );

  revoke = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.revokeCertificateUseCase.execute(
        getRequiredParam(request, 'certificateId'),
        request.body as RevokeCertificateDto,
        createUseCaseContext(request, response),
      );
      response.status(200).json(result);
    },
  );

  listByEmployee = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.listEmployeeCertificatesUseCase.execute(
        getRequiredParam(request, 'employeeId'),
        createUseCaseContext(request, response),
      );
      response.status(200).json(result);
    },
  );

  listByEnrollment = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.listEnrollmentCertificatesUseCase.execute(
        getRequiredParam(request, 'enrollmentId'),
        createUseCaseContext(request, response),
      );
      response.status(200).json(result);
    },
  );

  verify = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const result = await this.verifyCertificateUseCase.execute({
      verificationCode: getRequiredParam(request, 'verificationCode'),
      ipAddress: request.ip ?? null,
      userAgent: request.header('user-agent') ?? null,
    });
    response.status(200).json(result);
  });

  generateDocument = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.generateCertificateDocumentUseCase.execute(
        getRequiredParam(request, 'certificateId'),
        createUseCaseContext(request, response),
      );
      response.status(201).json(result);
    },
  );
}
