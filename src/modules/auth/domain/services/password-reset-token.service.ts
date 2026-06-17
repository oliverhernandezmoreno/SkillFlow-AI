import { SecureTokenGenerator } from './secure-token-generator.js';
import { TokenHasher } from './token-hasher.js';

export class PasswordResetTokenService {
  constructor(
    private readonly secureTokenGenerator = new SecureTokenGenerator(),
    private readonly tokenHasher = new TokenHasher(),
  ) {}

  createToken(): string {
    return this.secureTokenGenerator.generate();
  }

  hashToken(token: string): string {
    return this.tokenHasher.hash(token);
  }
}
