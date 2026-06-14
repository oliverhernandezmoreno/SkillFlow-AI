import type { Request, Response } from 'express';

import { asyncHandler } from '../../../../../shared/interfaces/http/async-handler.js';
import type { LoginDto, RegisterDto } from '../../../application/dto/auth.dto.js';
import type { GetCurrentUserUseCase } from '../../../application/use-cases/get-current-user.use-case.js';
import type { LoginUseCase } from '../../../application/use-cases/login.use-case.js';
import type { RefreshTokenUseCase } from '../../../application/use-cases/refresh-token.use-case.js';
import type { RegisterOrganizationUseCase } from '../../../application/use-cases/register-organization.use-case.js';
import type { AuthenticatedLocals } from '../auth-context.js';

export class AuthController {
  constructor(
    private readonly registerOrganizationUseCase: RegisterOrganizationUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly getCurrentUserUseCase: GetCurrentUserUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
  ) {}

  register = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const result = await this.registerOrganizationUseCase.execute(request.body as RegisterDto);
    response.status(201).json(result);
  });

  login = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const result = await this.loginUseCase.execute(request.body as LoginDto, {
      ipAddress: request.ip ?? null,
      userAgent: request.header('user-agent') ?? null,
    });
    response.status(200).json(result);
  });

  me = asyncHandler(
    async (_request: Request, response: Response<unknown, AuthenticatedLocals>): Promise<void> => {
      const userId = response.locals.auth?.userId ?? null;
      const organizationId = response.locals.auth?.organizationId ?? null;
      const result = await this.getCurrentUserUseCase.execute(userId, organizationId);
      response.status(200).json(result);
    },
  );

  refresh = asyncHandler(async (request: Request, response: Response): Promise<void> => {
    const body = request.body as { refreshToken: string };
    const result = this.refreshTokenUseCase.execute(body.refreshToken);
    response.status(200).json(result);
  });

  logout = asyncHandler(async (_request: Request, response: Response): Promise<void> => {
    response.status(204).send();
  });
}
