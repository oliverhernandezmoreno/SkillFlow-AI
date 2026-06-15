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
  AttachSenceDocumentDto,
  CreateSenceDeclarationDto,
  SubmitSenceDeclarationDto,
  UpdateSenceDeclarationDto,
  UpdateSenceStatusDto,
} from '../../../application/dto/sence.dto.js';
import type { AttachSenceDocumentUseCase } from '../../../application/use-cases/attach-sence-document.use-case.js';
import type { BuildSenceEvidenceUseCase } from '../../../application/use-cases/build-sence-evidence.use-case.js';
import type { CreateSenceDeclarationUseCase } from '../../../application/use-cases/create-sence-declaration.use-case.js';
import type { GetSenceDeclarationByTrainingSessionUseCase } from '../../../application/use-cases/get-sence-declaration-by-training-session.use-case.js';
import type { GetSenceDeclarationUseCase } from '../../../application/use-cases/get-sence-declaration.use-case.js';
import type { ListSenceDeclarationsUseCase } from '../../../application/use-cases/list-sence-declarations.use-case.js';
import type { ListSenceDocumentsUseCase } from '../../../application/use-cases/list-sence-documents.use-case.js';
import type { MarkSenceDeclarationReadyUseCase } from '../../../application/use-cases/mark-sence-declaration-ready.use-case.js';
import type { SubmitSenceDeclarationUseCase } from '../../../application/use-cases/submit-sence-declaration.use-case.js';
import type { UpdateSenceDeclarationStatusUseCase } from '../../../application/use-cases/update-sence-declaration-status.use-case.js';
import type { UpdateSenceDeclarationUseCase } from '../../../application/use-cases/update-sence-declaration.use-case.js';
import type { ValidateSenceComplianceUseCase } from '../../../application/use-cases/validate-sence-compliance.use-case.js';
import type { SenceDeclarationStatus } from '../../../domain/entities/sence-declaration.entity.js';

export class SenceController {
  constructor(
    private readonly listUseCase: ListSenceDeclarationsUseCase,
    private readonly getUseCase: GetSenceDeclarationUseCase,
    private readonly createUseCase: CreateSenceDeclarationUseCase,
    private readonly updateUseCase: UpdateSenceDeclarationUseCase,
    private readonly validateUseCase: ValidateSenceComplianceUseCase,
    private readonly evidenceUseCase: BuildSenceEvidenceUseCase,
    private readonly readyUseCase: MarkSenceDeclarationReadyUseCase,
    private readonly submitUseCase: SubmitSenceDeclarationUseCase,
    private readonly statusUseCase: UpdateSenceDeclarationStatusUseCase,
    private readonly attachDocumentUseCase: AttachSenceDocumentUseCase,
    private readonly listDocumentsUseCase: ListSenceDocumentsUseCase,
    private readonly getByTrainingSessionUseCase: GetSenceDeclarationByTrainingSessionUseCase,
  ) {}

  list = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.listUseCase.execute(
        {
          page: getOptionalQueryNumber(request, 'page'),
          pageSize: getOptionalQueryNumber(request, 'pageSize'),
          trainingSessionId: getOptionalQueryString(request, 'trainingSessionId'),
          courseId: getOptionalQueryString(request, 'courseId'),
          status: getOptionalQueryString(request, 'status') as SenceDeclarationStatus | undefined,
        },
        createUseCaseContext(request, response),
      );
      response.status(200).json(result);
    },
  );

  get = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.getUseCase.execute(
        getRequiredParam(request, 'declarationId'),
        createUseCaseContext(request, response),
      );
      response.status(200).json(result);
    },
  );

  create = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.createUseCase.execute(
        request.body as CreateSenceDeclarationDto,
        createUseCaseContext(request, response),
      );
      response.status(201).json(result);
    },
  );

  update = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.updateUseCase.execute(
        getRequiredParam(request, 'declarationId'),
        request.body as UpdateSenceDeclarationDto,
        createUseCaseContext(request, response),
      );
      response.status(200).json(result);
    },
  );

  validate = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.validateUseCase.execute(
        getRequiredParam(request, 'declarationId'),
        createUseCaseContext(request, response),
      );
      response.status(200).json(result);
    },
  );

  evidence = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.evidenceUseCase.execute(
        getRequiredParam(request, 'declarationId'),
        createUseCaseContext(request, response),
      );
      response.status(200).json(result);
    },
  );

  ready = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.readyUseCase.execute(
        getRequiredParam(request, 'declarationId'),
        createUseCaseContext(request, response),
      );
      response.status(200).json(result);
    },
  );

  submit = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.submitUseCase.execute(
        getRequiredParam(request, 'declarationId'),
        request.body as SubmitSenceDeclarationDto,
        createUseCaseContext(request, response),
      );
      response.status(200).json(result);
    },
  );

  status = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.statusUseCase.execute(
        getRequiredParam(request, 'declarationId'),
        request.body as UpdateSenceStatusDto,
        createUseCaseContext(request, response),
      );
      response.status(200).json(result);
    },
  );

  attachDocument = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.attachDocumentUseCase.execute(
        getRequiredParam(request, 'declarationId'),
        request.body as AttachSenceDocumentDto,
        createUseCaseContext(request, response),
      );
      response.status(201).json(result);
    },
  );

  listDocuments = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.listDocumentsUseCase.execute(
        getRequiredParam(request, 'declarationId'),
        createUseCaseContext(request, response),
      );
      response.status(200).json(result);
    },
  );

  getByTrainingSession = asyncHandler(
    async (request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const result = await this.getByTrainingSessionUseCase.execute(
        getRequiredParam(request, 'trainingSessionId'),
        createUseCaseContext(request, response),
      );
      response.status(200).json(result);
    },
  );
}
