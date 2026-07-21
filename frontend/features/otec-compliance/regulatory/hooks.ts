'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/constants/query-keys';
import * as service from './services';
import type { RegulatoryFilters } from './schemas';

const retry = (count: number, error: unknown) => ![400, 401, 403, 404, 409, 412, 422].includes((error as { status?: number }).status ?? 0) && count < 2;
export function useAccreditations(filters: RegulatoryFilters, enabled = true) { return useQuery({ queryKey: queryKeys.otecCompliance.accreditations.list(filters), queryFn: ({ signal }) => service.listAccreditations(filters, signal), enabled, retry, placeholderData: (previous) => previous }); }
export function useAccreditation(id: string | null, enabled = true) { return useQuery({ queryKey: queryKeys.otecCompliance.accreditations.detail(id ?? ''), queryFn: ({ signal }) => service.getAccreditation(id!, signal), enabled: enabled && Boolean(id), retry }); }
export function useCertifications(filters: RegulatoryFilters, enabled = true) { return useQuery({ queryKey: queryKeys.otecCompliance.certifications.list(filters), queryFn: ({ signal }) => service.listCertifications(filters, signal), enabled, retry, placeholderData: (previous) => previous }); }
export function useCertification(id: string | null, enabled = true) { return useQuery({ queryKey: queryKeys.otecCompliance.certifications.detail(id ?? ''), queryFn: ({ signal }) => service.getCertification(id!, signal), enabled: enabled && Boolean(id), retry }); }
export function useRegulatoryMutation<T>(kind: 'accreditation' | 'certification', mutationFn: (input: T) => Promise<unknown>) { const client = useQueryClient(); return useMutation({ mutationFn, retry: false, onSuccess: async () => { await client.invalidateQueries({ queryKey: kind === 'accreditation' ? queryKeys.otecCompliance.accreditations.lists() : queryKeys.otecCompliance.certifications.lists() }); } }); }
