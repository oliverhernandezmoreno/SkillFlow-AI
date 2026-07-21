import { BadRequestError } from '../../../../../shared/domain/errors.js';

const versionTag = /^W\/"v([1-9]\d*)"$/;

export function parseIfMatch(value: string | undefined): number {
  const match = value?.match(versionTag);
  if (!match?.[1]) throw new BadRequestError('If-Match must use W/"v<positive integer>"');
  return Number(match[1]);
}

export function formatVersionEtag(version: number): string {
  if (!Number.isInteger(version) || version < 1)
    throw new BadRequestError('Version must be positive');
  return `W/"v${String(version)}"`;
}
