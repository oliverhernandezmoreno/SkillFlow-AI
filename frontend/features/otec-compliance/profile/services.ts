import { apiRequestWithMetadata } from '@/lib/api/client';
import {
  createOtecProfileSchema,
  deactivateOtecProfileSchema,
  otecProfileSchema,
  updateOtecProfileSchema,
  type DeactivateOtecProfilePayload,
  type OtecProfile,
  type OtecProfilePayload,
} from './schemas';

export interface VersionedOtecProfile {
  profile: OtecProfile;
  etag: string | null;
}

async function parseVersioned(request: Promise<{ data: unknown; etag: string | null }>): Promise<VersionedOtecProfile> {
  const response = await request;
  return { profile: otecProfileSchema.parse(response.data), etag: response.etag };
}

export function getOtecProfile(signal?: AbortSignal) {
  return parseVersioned(apiRequestWithMetadata<unknown>('/otec-compliance/profile', { signal }));
}

export function createOtecProfile(input: OtecProfilePayload) {
  const body = createOtecProfileSchema.parse(input);
  return parseVersioned(apiRequestWithMetadata<unknown>('/otec-compliance/profile', { method: 'POST', body }));
}

export function updateOtecProfile({ input, etag }: { input: OtecProfilePayload; etag: string }) {
  const body = updateOtecProfileSchema.parse(input);
  return parseVersioned(apiRequestWithMetadata<unknown>('/otec-compliance/profile', {
    method: 'PATCH', headers: { 'If-Match': etag }, body,
  }));
}

export function deactivateOtecProfile({ input, etag }: { input: DeactivateOtecProfilePayload; etag: string }) {
  const body = deactivateOtecProfileSchema.parse(input);
  return apiRequestWithMetadata<void>('/otec-compliance/profile/deactivation', {
    method: 'POST', headers: { 'If-Match': etag }, body,
  });
}
