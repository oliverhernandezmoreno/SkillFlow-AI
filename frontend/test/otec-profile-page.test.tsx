import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, vi } from 'vitest';

import { ToastProvider } from '@/components/feedback/toast-provider';
import { OtecProfilePageContent } from '@/features/otec-compliance/profile/otec-profile-page-content';
import { useAuthStore } from '@/stores/auth-store';

const service = vi.hoisted(() => ({
  get: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  deactivate: vi.fn(),
}));

vi.mock('@/features/otec-compliance/profile/services', () => ({
  getOtecProfile: service.get,
  createOtecProfile: service.create,
  updateOtecProfile: service.update,
  deactivateOtecProfile: service.deactivate,
}));

function renderPage(permissions = ['otec_compliance.read', 'otec_compliance.profile.manage']) {
  useAuthStore.setState({
    user: {
      id: 'user', organizationId: 'tenant', email: 'admin@example.test', firstName: 'Admin', lastName: 'User', permissions,
    },
  });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider><OtecProfilePageContent /></ToastProvider>
    </QueryClientProvider>,
  );
}

describe('OtecProfile page', () => {
  beforeEach(() => {
    Object.values(service).forEach((mock) => mock.mockReset());
  });
  it('renders the empty state and hides create without manage permission', async () => {
    service.get.mockRejectedValueOnce(Object.assign(new Error('Not found'), { status: 404 }));
    renderPage(['otec_compliance.read']);
    expect(await screen.findByText('Aún no existe un perfil OTEC')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /crear perfil otec/i })).not.toBeInTheDocument();
  });

  it('renders profile data and permitted actions', async () => {
    service.get.mockResolvedValueOnce({
      profile: {
        id: '10000000-0000-4000-8000-000000000001', registrationCode: 'OTEC-001', registrationStatus: 'ACTIVE',
        rudoReference: null, accreditationDate: null, suspensionDate: null, cessationDate: null,
        technicalContactName: 'Ana Pérez', technicalContactEmail: 'ana@example.test', technicalContactPhone: null,
        notes: 'Internal configuration', createdAt: '2026-07-20T12:00:00.000Z', updatedAt: '2026-07-20T12:00:00.000Z', version: 3,
      },
      etag: 'W/"v3"',
    });
    renderPage();
    expect(await screen.findByText('OTEC-001')).toBeInTheDocument();
    expect(screen.getByText('Ana Pérez')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /editar perfil/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /desactivar perfil/i })).toBeInTheDocument();
    expect(screen.queryByText(/organizationId/i)).not.toBeInTheDocument();
  });

  it('distinguishes a module-unavailable response', async () => {
    service.get.mockRejectedValueOnce(Object.assign(new Error('Unavailable'), {
      status: 403, payload: { error: { code: 'MODULE_UNAVAILABLE', message: 'Unavailable' } },
    }));
    renderPage();
    expect(await screen.findByText('Módulo OTEC no disponible')).toBeInTheDocument();
  });

  it('requires confirmation before deactivation', async () => {
    const user = userEvent.setup();
    service.get.mockResolvedValueOnce({
      profile: {
        id: '10000000-0000-4000-8000-000000000001', registrationCode: 'OTEC-001', registrationStatus: 'ACTIVE',
        rudoReference: null, accreditationDate: null, suspensionDate: null, cessationDate: null,
        technicalContactName: null, technicalContactEmail: null, technicalContactPhone: null, notes: null,
        createdAt: '2026-07-20T12:00:00.000Z', updatedAt: '2026-07-20T12:00:00.000Z', version: 1,
      }, etag: 'W/"v1"',
    });
    service.deactivate.mockResolvedValueOnce({ data: undefined, etag: null });
    renderPage();
    await user.click(await screen.findByRole('button', { name: /desactivar perfil/i }));
    expect(screen.getByRole('dialog')).toHaveTextContent(/puede afectar la preparación operacional/i);
    expect(service.deactivate).not.toHaveBeenCalled();
  });

  it('preserves the edit form and refetches after a stale conflict', async () => {
    const user = userEvent.setup();
    const current = {
      profile: {
        id: '10000000-0000-4000-8000-000000000001', registrationCode: 'OTEC-001', registrationStatus: 'ACTIVE',
        rudoReference: null, accreditationDate: null, suspensionDate: null, cessationDate: null,
        technicalContactName: null, technicalContactEmail: null, technicalContactPhone: null, notes: 'Original',
        createdAt: '2026-07-20T12:00:00.000Z', updatedAt: '2026-07-20T12:00:00.000Z', version: 1,
      }, etag: 'W/"v1"',
    };
    service.get.mockResolvedValueOnce(current).mockResolvedValueOnce({
      ...current, profile: { ...current.profile, notes: 'External update', version: 2 }, etag: 'W/"v2"',
    });
    service.update.mockRejectedValueOnce(Object.assign(new Error('Conflict'), { status: 409 }));
    renderPage();
    await user.click(await screen.findByRole('button', { name: /editar perfil/i }));
    const notes = screen.getByLabelText('Notas');
    await user.clear(notes);
    await user.type(notes, 'My safe draft');
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/actualizado por otra sesión/i);
    expect(notes).toHaveValue('My safe draft');
    expect(service.get).toHaveBeenCalledTimes(2);
  });
});
