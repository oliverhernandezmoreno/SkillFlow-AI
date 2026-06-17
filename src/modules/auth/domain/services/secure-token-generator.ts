import { randomBytes } from 'node:crypto';

export class SecureTokenGenerator {
  generate(byteLength = 32): string {
    return randomBytes(byteLength).toString('base64url');
  }
}
