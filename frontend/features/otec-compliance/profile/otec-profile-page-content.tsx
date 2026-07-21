'use client';

import { Building2, Pencil, Power } from 'lucide-react';
import { useState } from 'react';

import { ErrorState } from '@/components/feedback/error-state';
import { LoadingSkeleton } from '@/components/feedback/loading-skeleton';
import { StatusBadge } from '@/components/feedback/status-badge';
import { useToast } from '@/components/feedback/toast-provider';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogTitle } from '@/components/ui/dialog';
import { ApiClientError } from '@/lib/api/client';
import { getErrorMessage } from '@/lib/api/errors';
import { useAuthStore } from '@/stores/auth-store';
import { useCreateOtecProfile, useDeactivateOtecProfile, useOtecProfile, useUpdateOtecProfile } from './hooks';
import { OtecProfileForm } from './otec-profile-form';
import { toOtecProfilePayload, type OtecProfileFormValues } from './schemas';
import { OtecNavigation } from '../otec-navigation';

export function OtecProfilePageContent() {
  const user = useAuthStore((state) => state.user);
  const permissions = user?.permissions ?? [];
  const canRead = permissions.includes('otec_compliance.read') || permissions.includes('otec_compliance.profile.manage');
  const canManage = permissions.includes('otec_compliance.profile.manage');
  const profileQuery = useOtecProfile();
  const createMutation = useCreateOtecProfile();
  const updateMutation = useUpdateOtecProfile();
  const deactivateMutation = useDeactivateOtecProfile();
  const { showToast } = useToast();
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function submit(values: OtecProfileFormValues) {
    setSubmitError(null);
    try {
      if (formMode === 'create') {
        await createMutation.mutateAsync(toOtecProfilePayload(values));
      } else {
        if (!profileQuery.data?.etag) throw new Error('No se recibió una versión ETag. Recarga el perfil antes de editar.');
        await updateMutation.mutateAsync({ input: toOtecProfilePayload(values), etag: profileQuery.data.etag });
      }
      setFormMode(null);
      showToast({ title: formMode === 'create' ? 'Perfil OTEC creado' : 'Perfil OTEC actualizado', tone: 'success' });
    } catch (error) {
      if (isConflict(error)) {
        setSubmitError('El perfil fue actualizado por otra sesión. Recargamos la información; revisa tus cambios antes de volver a guardar.');
        await profileQuery.refetch();
      } else {
        setSubmitError(getErrorMessage(error));
      }
    }
  }

  async function deactivate() {
    if (!profileQuery.data?.etag) return;
    try {
      await deactivateMutation.mutateAsync({ input: {}, etag: profileQuery.data.etag });
      setConfirmOpen(false);
      showToast({ title: 'Perfil OTEC desactivado', description: 'La configuración quedó como antecedente histórico.', tone: 'success' });
    } catch (error) {
      setConfirmOpen(false);
      if (isConflict(error)) await profileQuery.refetch();
      showToast({ title: 'No se pudo desactivar el perfil', description: getErrorMessage(error), tone: 'error' });
    }
  }

  if (!canRead) return <ErrorState title="Sin permiso para consultar OTEC Compliance" description="Tu cuenta no tiene el permiso de lectura requerido." />;
  if (profileQuery.isLoading) return <LoadingSkeleton />;

  const error = profileQuery.error as ApiClientError | undefined;
  if (error && error.status === 403 && error.payload?.error?.code === 'MODULE_UNAVAILABLE') {
    return <ErrorState title="Módulo OTEC no disponible" description="El entitlement OTEC Compliance no está habilitado para esta organización." />;
  }
  if (error && error.status === 403) return <ErrorState title="Sin permiso para consultar OTEC Compliance" description="El backend rechazó el acceso a este módulo." />;
  if (error && error.status === 401) return <ErrorState title="Sesión expirada" description="Vuelve a iniciar sesión para continuar." />;
  if (error && error.status !== 404) return <ErrorState description={getErrorMessage(error)} onAction={() => void profileQuery.refetch()} />;

  const versioned = profileQuery.data;
  const profile = versioned?.profile;

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">Configuración / OTEC Compliance / Perfil</nav>
      <OtecNavigation />
      <PageHeader title="Perfil OTEC" description="Administra la configuración interna del perfil OTEC del tenant autenticado." icon={Building2} />

      {!profile ? (
        formMode === 'create' ? (
          <OtecProfileForm mode="create" submitting={createMutation.isPending} submitError={submitError} onCancel={() => setFormMode(null)} onSubmit={submit} />
        ) : (
          <Card className="flex flex-col items-center gap-4 p-8 text-center sm:p-10">
            <Building2 className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
            <div><h2 className="font-semibold">Aún no existe un perfil OTEC</h2><p className="mt-1 text-sm text-muted-foreground">Crea la configuración interna cuando tu organización esté preparada.</p></div>
            {canManage ? <Button onClick={() => setFormMode('create')}>Crear perfil OTEC</Button> : null}
          </Card>
        )
      ) : formMode === 'edit' ? (
        <OtecProfileForm mode="edit" profile={profile} submitting={updateMutation.isPending} submitError={submitError} onCancel={() => setFormMode(null)} onSubmit={submit} />
      ) : (
        <>
          <Card className="p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="text-sm text-muted-foreground">Estado</p><div className="mt-1"><StatusBadge status={profile.registrationStatus} /></div></div>
              {canManage ? <div className="flex flex-col gap-2 sm:flex-row"><Button variant="outline" onClick={() => setFormMode('edit')}><Pencil className="h-4 w-4" />Editar perfil</Button><Button variant="destructive" onClick={() => setConfirmOpen(true)}><Power className="h-4 w-4" />Desactivar perfil</Button></div> : null}
            </div>
            <dl className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Código de registro" value={profile.registrationCode} />
              <Field label="Referencia RUDO" value={profile.rudoReference} />
              <Field label="Contacto técnico" value={profile.technicalContactName} />
              <Field label="Correo técnico" value={profile.technicalContactEmail} />
              <Field label="Teléfono técnico" value={profile.technicalContactPhone} />
              <Field label="Versión" value={String(profile.version)} />
              <div className="sm:col-span-2 lg:col-span-3"><Field label="Notas" value={profile.notes} /></div>
            </dl>
          </Card>
          <p className="text-sm text-muted-foreground">Información interna; no representa acreditación ni validación oficial de SENCE, RUDO, OTIC o LCE.</p>
        </>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogPortal><DialogOverlay className="fixed inset-0 z-50 bg-slate-950/40" /><DialogContent className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-card p-6 shadow-soft">
          <DialogTitle>Desactivar perfil OTEC</DialogTitle><DialogDescription className="mt-2 text-sm text-muted-foreground">Esta acción puede afectar la preparación operacional del módulo. El antecedente permanecerá en el historial.</DialogDescription>
          <div className="mt-6 flex justify-end gap-2"><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button variant="destructive" disabled={deactivateMutation.isPending} onClick={() => void deactivate()}>{deactivateMutation.isPending ? 'Desactivando…' : 'Confirmar desactivación'}</Button></div>
        </DialogContent></DialogPortal>
      </Dialog>
    </div>
  );
}

function Field({ label, value }: Readonly<{ label: string; value: string | null }>) {
  return <div><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt><dd className="mt-1 break-words text-sm font-medium">{value || 'No informado'}</dd></div>;
}

function isConflict(error: unknown) { return [409, 412].includes((error as { status?: number }).status ?? 0); }
