import type { Request, Response } from 'express';

import type { GetHealthStatusUseCase } from '../../../application/system/use-cases/get-health-status.use-case.js';

export class HealthController {
  constructor(private readonly getHealthStatusUseCase: GetHealthStatusUseCase) {}

  getHealth = (_request: Request, response: Response): void => {
    response.status(200).json(this.getHealthStatusUseCase.execute());
  };
}
