import bcrypt from 'bcrypt';

import type { PasswordHasher } from '../../domain/services/password-hasher.js';

export class NodePasswordHasher implements PasswordHasher {
  private static readonly saltRounds = 12;

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, NodePasswordHasher.saltRounds);
  }

  async verify(password: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(password, passwordHash);
  }
}
