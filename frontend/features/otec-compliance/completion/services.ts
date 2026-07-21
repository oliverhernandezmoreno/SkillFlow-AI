/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiRequestWithMetadata } from '@/lib/api/client';
import { readinessSchema, resolutionSchema, summarySchema, type Filters } from './schemas';
const qs = (f: Filters) =>
  new URLSearchParams(
    Object.entries(f)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)]),
  ).toString();
const one = async (p: Promise<{ data: unknown; etag: string | null }>) => {
  const r = await p;
  return { record: resolutionSchema.parse(r.data), etag: r.etag };
};
export async function listResolutions(f: Filters, signal?: AbortSignal) {
  const r = await apiRequestWithMetadata<unknown>(`/otec-compliance/resolutions?${qs(f)}`, {
    signal,
  });
  const x = r.data as { data: unknown[]; meta: any };
  return { data: x.data.map((v) => resolutionSchema.parse(v)), meta: x.meta };
}
export const getResolution = (id: string, signal?: AbortSignal) =>
  one(apiRequestWithMetadata(`/otec-compliance/resolutions/${id}`, { signal }));
export const createResolution = (otecProfileId: string, input: object) =>
  one(
    apiRequestWithMetadata('/otec-compliance/resolutions', {
      method: 'POST',
      body: { otecProfileId, ...input },
    }),
  );
export const updateResolution = ({
  id,
  etag,
  input,
}: {
  id: string;
  etag: string;
  input: object;
}) =>
  one(
    apiRequestWithMetadata(`/otec-compliance/resolutions/${id}`, {
      method: 'PATCH',
      headers: { 'If-Match': etag },
      body: input,
    }),
  );
export const deactivateResolution = ({ id, etag }: { id: string; etag: string }) =>
  one(
    apiRequestWithMetadata(`/otec-compliance/resolutions/${id}/deactivation`, {
      method: 'POST',
      headers: { 'If-Match': etag },
      body: {},
    }),
  );
export async function supersedeResolution(a: {
  id: string;
  etag: string;
  replacementResolutionId: string;
  replacementIfMatch: string;
}) {
  return apiRequestWithMetadata(`/otec-compliance/resolutions/${a.id}/supersession`, {
    method: 'POST',
    headers: { 'If-Match': a.etag },
    body: {
      replacementResolutionId: a.replacementResolutionId,
      replacementIfMatch: a.replacementIfMatch,
    },
  });
}
export async function dashboard(profileId: string, signal?: AbortSignal) {
  const [
    summary,
    readiness,
    expiring,
    accreditations,
    certifications,
    offices,
    representatives,
    resolutions,
  ] = await Promise.all([
    apiRequestWithMetadata(`/otec-compliance/compliance-summary?otecProfileId=${profileId}`, {
      signal,
    }),
    apiRequestWithMetadata('/otec-compliance/readiness/evaluations', {
      method: 'POST',
      body: { otecProfileId: profileId },
      signal,
    }),
    apiRequestWithMetadata(
      `/otec-compliance/expiring-items?otecProfileId=${profileId}&page=1&pageSize=100`,
      { signal },
    ),
    ...[
      'accreditations',
      'quality-certifications',
      'offices',
      'legal-representatives',
      'resolutions',
    ].map((path) =>
      apiRequestWithMetadata(`/otec-compliance/${path}?page=1&pageSize=1`, { signal }),
    ),
  ]);
  return {
    summary: summarySchema.parse(summary.data),
    readiness: readinessSchema.parse(readiness.data),
    expiring: expiring.data as any,
    counts: {
      accreditations: (accreditations.data as any).meta.total,
      certifications: (certifications.data as any).meta.total,
      offices: (offices.data as any).meta.total,
      representatives: (representatives.data as any).meta.total,
      resolutions: (resolutions.data as any).meta.total,
    },
  };
}
