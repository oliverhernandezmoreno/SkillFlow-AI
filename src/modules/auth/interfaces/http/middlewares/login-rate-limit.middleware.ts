import type { NextFunction, Request, Response } from 'express';

import { TooManyRequestsError } from '../../../../../shared/domain/errors.js';

interface LoginAttemptBucket {
  count: number;
  resetAt: number;
}

const loginAttemptBuckets = new Map<string, LoginAttemptBucket>();
const windowMs = 60_000;
const maxAttempts = 5;

export function loginRateLimit(request: Request, _response: Response, next: NextFunction): void {
  const key = request.ip ?? 'unknown';
  const now = Date.now();
  const bucket = loginAttemptBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    loginAttemptBuckets.set(key, { count: 1, resetAt: now + windowMs });
    next();
    return;
  }

  if (bucket.count >= maxAttempts) {
    throw new TooManyRequestsError('Too many login attempts');
  }

  bucket.count += 1;
  next();
}
