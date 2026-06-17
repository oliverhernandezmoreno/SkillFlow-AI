import type { Request, Response } from 'express';

import type { Environment } from '../../../config/environment.js';
import { BootstrapDemoUseCase } from '../../../application/system/use-cases/bootstrap-demo.use-case.js';
import { ForbiddenError, NotFoundError } from '../../../shared/domain/errors.js';
import { asyncHandler } from '../../../shared/interfaces/http/async-handler.js';

export class SystemController {
  constructor(
    private readonly environment: Environment,
    private readonly bootstrapDemoUseCase = new BootstrapDemoUseCase(),
  ) {}

  bootstrapDemo = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    if (this.environment.NODE_ENV !== 'production' || !this.environment.ENABLE_DEMO_BOOTSTRAP) {
      throw new NotFoundError('Demo bootstrap endpoint is not available');
    }

    const secret = request.header('x-bootstrap-secret');
    if (!this.environment.BOOTSTRAP_SECRET || secret !== this.environment.BOOTSTRAP_SECRET) {
      throw new ForbiddenError('Invalid bootstrap secret');
    }

    const summary = await this.bootstrapDemoUseCase.execute({
      ipAddress: request.ip ?? null,
      userAgent: request.get('user-agent') ?? null,
    });

    response.status(200).json({
      status: 'ok',
      summary,
    });
  });
}
