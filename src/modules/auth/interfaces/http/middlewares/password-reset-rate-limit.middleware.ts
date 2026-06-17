import type { NextFunction, Request, Response } from 'express';

import { TooManyRequestsError } from '../../../../../shared/domain/errors.js';

interface ResetAttemptBucket {
  count: number;
  resetAt: number;
}

const resetAttemptBuckets = new Map<string, ResetAttemptBucket>();
const windowMs = 15 * 60 * 1000;
const maxAttempts = 5;

export function passwordResetRateLimit(request: Request, _response: Response, next: NextFunction): void {
  const body = request.body as { email?: unknown; token?: unknown } | undefined;
  const email = typeof body?.email === 'string' ? body.email.toLowerCase() : 'unknown';
  const token = typeof body?.token === 'string' ? body.token.slice(0, 12) : 'none';
  const key = `${request.ip ?? 'unknown'}:${email}:${token}`;
  const now = Date.now();
  const bucket = resetAttemptBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    resetAttemptBuckets.set(key, { count: 1, resetAt: now + windowMs });
    next();
    return;
  }

  if (bucket.count >= maxAttempts) {
    throw new TooManyRequestsError('Too many password reset attempts');
  }

  bucket.count += 1;
  next();
}
