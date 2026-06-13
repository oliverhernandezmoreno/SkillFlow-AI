import type { AuthTokenPayload } from '../../domain/services/token-service.js';

export interface AuthenticatedLocals {
  auth?: AuthTokenPayload;
}
