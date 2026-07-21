import { apiRequestWithMetadata } from '@/lib/api/client';
import { accreditationPayloadSchema, accreditationSchema, certificationPayloadSchema, certificationSchema, type AccreditationPayload, type CertificationPayload, type Page, type RegulatoryFilters } from './schemas';

export type Versioned<T> = { record: T; etag: string | null };
const query = (filters: RegulatoryFilters) => new URLSearchParams(Object.entries(filters).filter(([, value]) => value !== undefined && value !== '').map(([key, value]) => [key, String(value)])).toString();
async function page<T>(request: Promise<{ data: unknown }>, schema: { parse: (value: unknown) => T }): Promise<Page<T>> { const response = await request; const raw = response.data as Page<unknown>; return { data: raw.data.map((item) => schema.parse(item)), meta: raw.meta }; }
async function versioned<T>(request: Promise<{ data: unknown; etag: string | null }>, schema: { parse: (value: unknown) => T }): Promise<Versioned<T>> { const response = await request; return { record: schema.parse(response.data), etag: response.etag }; }
const headers = (etag: string) => ({ 'If-Match': etag });

export const listAccreditations = (filters: RegulatoryFilters, signal?: AbortSignal) => page(apiRequestWithMetadata(`/otec-compliance/accreditations?${query(filters)}`, { signal }), accreditationSchema);
export const getAccreditation = (id: string, signal?: AbortSignal) => versioned(apiRequestWithMetadata(`/otec-compliance/accreditations/${id}`, { signal }), accreditationSchema);
export const createAccreditation = (otecProfileId: string, input: AccreditationPayload) => versioned(apiRequestWithMetadata('/otec-compliance/accreditations', { method: 'POST', body: { otecProfileId, ...accreditationPayloadSchema.parse(input) } }), accreditationSchema);
export const updateAccreditation = ({ id, etag, input }: { id: string; etag: string; input: AccreditationPayload }) => versioned(apiRequestWithMetadata(`/otec-compliance/accreditations/${id}`, { method: 'PATCH', headers: headers(etag), body: accreditationPayloadSchema.parse(input) }), accreditationSchema);
export const suspendAccreditation = ({ id, etag, reason }: { id: string; etag: string; reason?: string }) => versioned(apiRequestWithMetadata(`/otec-compliance/accreditations/${id}/suspension`, { method: 'POST', headers: headers(etag), body: reason ? { reason } : {} }), accreditationSchema);
export const revokeAccreditation = ({ id, etag, reason }: { id: string; etag: string; reason?: string }) => versioned(apiRequestWithMetadata(`/otec-compliance/accreditations/${id}/revocation`, { method: 'POST', headers: headers(etag), body: reason ? { reason } : {} }), accreditationSchema);

export const listCertifications = (filters: RegulatoryFilters, signal?: AbortSignal) => page(apiRequestWithMetadata(`/otec-compliance/quality-certifications?${query(filters)}`, { signal }), certificationSchema);
export const getCertification = (id: string, signal?: AbortSignal) => versioned(apiRequestWithMetadata(`/otec-compliance/quality-certifications/${id}`, { signal }), certificationSchema);
export const createCertification = (otecProfileId: string, input: CertificationPayload) => versioned(apiRequestWithMetadata('/otec-compliance/quality-certifications', { method: 'POST', body: { otecProfileId, ...certificationPayloadSchema.parse(input) } }), certificationSchema);
export const updateCertification = ({ id, etag, input }: { id: string; etag: string; input: Partial<CertificationPayload> }) => versioned(apiRequestWithMetadata(`/otec-compliance/quality-certifications/${id}`, { method: 'PATCH', headers: headers(etag), body: certificationPayloadSchema.partial().parse(input) }), certificationSchema);
export const deactivateCertification = ({ id, etag, reason }: { id: string; etag: string; reason?: string }) => versioned(apiRequestWithMetadata(`/otec-compliance/quality-certifications/${id}/deactivation`, { method: 'POST', headers: headers(etag), body: reason ? { reason } : {} }), certificationSchema);
