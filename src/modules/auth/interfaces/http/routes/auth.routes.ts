import { Router } from 'express';

import { PrismaOrganizationRepository } from '../../../../organizations/infrastructure/prisma/prisma-organization.repository.js';
import { PrismaUserRepository } from '../../../../users/infrastructure/prisma/prisma-user.repository.js';
import { validateBody } from '../../../../../shared/interfaces/http/validate-request.js';
import { GetCurrentUserUseCase } from '../../../application/use-cases/get-current-user.use-case.js';
import { LoginUseCase } from '../../../application/use-cases/login.use-case.js';
import { RefreshTokenUseCase } from '../../../application/use-cases/refresh-token.use-case.js';
import { RegisterOrganizationUseCase } from '../../../application/use-cases/register-organization.use-case.js';
import { PrismaAuthIdentityRepository } from '../../../infrastructure/prisma/prisma-auth-identity.repository.js';
import { JwtTokenService } from '../../../infrastructure/services/jwt-token.service.js';
import { NodePasswordHasher } from '../../../infrastructure/services/node-password-hasher.js';
import { AuthController } from '../controllers/auth.controller.js';
import { loginRateLimit } from '../middlewares/login-rate-limit.middleware.js';
import { requireAuth } from '../middlewares/require-auth.middleware.js';
import { loginSchema, refreshTokenSchema, registerSchema } from '../validators/auth.validators.js';

export function createAuthRouter(): Router {
  const router = Router();
  const organizationRepository = new PrismaOrganizationRepository();
  const userRepository = new PrismaUserRepository();
  const authIdentityRepository = new PrismaAuthIdentityRepository();
  const passwordHasher = new NodePasswordHasher();
  const tokenService = new JwtTokenService();
  const controller = new AuthController(
    new RegisterOrganizationUseCase(
      organizationRepository,
      userRepository,
      passwordHasher,
      tokenService,
    ),
    new LoginUseCase(authIdentityRepository, passwordHasher, tokenService),
    new GetCurrentUserUseCase(userRepository),
    new RefreshTokenUseCase(tokenService),
  );

  router.post('/auth/register', validateBody(registerSchema), controller.register);
  router.post('/auth/login', loginRateLimit, validateBody(loginSchema), controller.login);
  router.get('/auth/me', requireAuth(tokenService), controller.me);
  router.post('/auth/refresh', validateBody(refreshTokenSchema), controller.refresh);
  router.post('/auth/logout', requireAuth(tokenService), controller.logout);

  return router;
}
