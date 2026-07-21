import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, vi } from 'vitest';
import { ToastProvider } from '@/components/feedback/toast-provider';
import { RegulatoryPage } from '@/features/otec-compliance/regulatory/regulatory-page';
import { useAuthStore } from '@/stores/auth-store';

const api = vi.hoisted(() => ({ listAccreditations: vi.fn(), getAccreditation: vi.fn(), createAccreditation: vi.fn(), updateAccreditation: vi.fn(), suspendAccreditation: vi.fn(), revokeAccreditation: vi.fn(), listCertifications: vi.fn(), getCertification: vi.fn(), createCertification: vi.fn(), updateCertification: vi.fn(), deactivateCertification: vi.fn(), getProfile: vi.fn() }));
vi.mock('@/features/otec-compliance/regulatory/services', () => api);
vi.mock('@/features/otec-compliance/profile/services', () => ({ getOtecProfile: api.getProfile, createOtecProfile: vi.fn(), updateOtecProfile: vi.fn(), deactivateOtecProfile: vi.fn() }));
vi.mock('next/navigation', () => ({ usePathname: () => '/otec-compliance/accreditations' }));

function renderPage(kind: 'accreditation' | 'certification', permissions = ['otec_compliance.read', `otec_compliance.${kind}.manage`]) {
  useAuthStore.setState({ user: { id: 'u', organizationId: 'tenant', email: 'u@example.test', firstName: 'A', lastName: 'B', permissions } });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}><ToastProvider><RegulatoryPage kind={kind} /></ToastProvider></QueryClientProvider>);
}
beforeEach(() => { Object.values(api).forEach((mock) => mock.mockReset()); api.getProfile.mockResolvedValue({ profile: { id: '30000000-0000-4000-8000-000000000001' }, etag: 'W/"v1"' }); });

describe('OTEC regulatory pages', () => {
  it('renders accreditation empty state and hides management for read-only users', async () => {
    api.listAccreditations.mockResolvedValue(emptyPage());
    renderPage('accreditation', ['otec_compliance.read']);
    expect(await screen.findByText('No hay acreditaciones registradas')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /crear acreditación/i })).not.toBeInTheDocument();
  });
  it('renders certification list, approved filters, and pagination', async () => {
    api.listCertifications.mockResolvedValue({ data: [certification()], meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 } });
    renderPage('certification');
    expect(await screen.findByText('CERT-001')).toBeInTheDocument();
    expect(screen.getByLabelText('Estado')).toBeInTheDocument();
    expect(screen.getByLabelText('Tipo')).toBeInTheDocument();
    expect(screen.getByText('Página 1 de 1')).toBeInTheDocument();
  });
  it('loads detail ETag and requires confirmation for a transition', async () => {
    const user = userEvent.setup();
    api.listAccreditations.mockResolvedValue({ data: [accreditation()], meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 } });
    api.getAccreditation.mockResolvedValue({ record: accreditation(), etag: 'W/"v2"' });
    renderPage('accreditation');
    await user.click(await screen.findByRole('button', { name: /ver detalle/i }));
    await user.click(await screen.findByRole('button', { name: /suspender/i }));
    expect(screen.getByRole('dialog')).toHaveTextContent(/afecta la vigencia/i);
    expect(api.suspendAccreditation).not.toHaveBeenCalled();
  });
  it('renders module unavailable distinctly', async () => {
    api.listCertifications.mockRejectedValue(Object.assign(new Error('Unavailable'), { status: 403, payload: { error: { code: 'MODULE_UNAVAILABLE' } } }));
    renderPage('certification');
    expect(await screen.findByText('Módulo OTEC no disponible')).toBeInTheDocument();
  });
});
function emptyPage() { return { data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } }; }
function accreditation() { return { id: '10000000-0000-4000-8000-000000000001', otecProfileId: '30000000-0000-4000-8000-000000000001', accreditationType: 'INTERNAL', accreditationNumber: 'ACC-001', status: 'ACTIVE', issuedAt: '2026-01-01T00:00:00.000Z', validFrom: '2026-01-01T00:00:00.000Z', validUntil: '2027-01-01T00:00:00.000Z', suspendedAt: null, revokedAt: null, issuingAuthority: null, source: null, externalReference: null, notes: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', version: 2 }; }
function certification() { return { id: '20000000-0000-4000-8000-000000000001', otecProfileId: '30000000-0000-4000-8000-000000000001', certificationType: 'NCH_2728', certificationNumber: 'CERT-001', certifyingEntity: 'Entity', scope: null, issuedAt: '2026-01-01T00:00:00.000Z', validFrom: '2026-01-01T00:00:00.000Z', validUntil: '2027-01-01T00:00:00.000Z', status: 'ACTIVE', documentId: null, notes: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', version: 1 }; }
