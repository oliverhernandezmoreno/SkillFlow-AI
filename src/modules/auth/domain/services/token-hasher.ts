import { createHash } from 'node:crypto';

export class TokenHasher {
  hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
