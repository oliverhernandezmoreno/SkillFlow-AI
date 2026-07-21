'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { ErrorState } from '@/components/feedback/error-state';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/forms/form-field';
import { LoadingSkeleton } from '@/components/feedback/loading-skeleton';
import { StatusBadge } from '@/components/feedback/status-badge';
import { PageHeader } from '@/components/layout/page-header';
import { OtecNavigation } from '../otec-navigation';
import { useActiveOtecProfileContext } from '../use-active-profile-context';
import { queryKeys } from '@/lib/constants/query-keys';
import {
  createResolution,
  deactivateResolution,
  getResolution,
  listResolutions,
  supersedeResolution,
  updateResolution,
} from './services';
import { payload, resolutionFormSchema, type ResolutionForm } from './schemas';
import { FileCheck2 } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { getErrorMessage } from '@/lib/api/errors';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from '@/components/ui/dialog';
const EMPTY_PERMISSIONS: string[] = [];
type Confirmation =
  | { type: 'deactivate' }
  | { type: 'supersede'; replacementId: string; label: string };
export function ResolutionsPage() {
  const permissions = useAuthStore((state) => state.user?.permissions ?? EMPTY_PERMISSIONS);
  const canRead = permissions.includes('otec_compliance.read');
  const canManage = permissions.includes('otec_compliance.resolution.manage');
  const profile = useActiveOtecProfileContext();
  const client = useQueryClient();
  const [listMode, setListMode] = useState(false);
  const [id, setId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const list = useQuery({
    queryKey: queryKeys.otecCompliance.resolutions.list({ page: 1, pageSize: 20 }),
    queryFn: ({ signal }) => listResolutions({ page: 1, pageSize: 20 }, signal),
    retry: false,
  });
  const detail = useQuery({
    queryKey: queryKeys.otecCompliance.resolutions.detail(id ?? ''),
    queryFn: ({ signal }) => getResolution(id!, signal),
    enabled: Boolean(id),
    retry: false,
  });
  const defaults: ResolutionForm = {
    resolutionType: 'AUTHORIZATION',
    resolutionNumber: '',
    issuingAuthority: '',
    issuedAt: '',
    validFrom: '',
    validUntil: '',
    scope: '',
    documentId: '',
    notes: '',
  };
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ResolutionForm>({
    resolver: zodResolver(resolutionFormSchema),
    defaultValues: defaults,
  });
  const mutation = useMutation({
    mutationFn: async (v: ResolutionForm) =>
      id && detail.data
        ? updateResolution({ id, etag: detail.data.etag!, input: payload(v) })
        : createResolution(profile.profileId!, payload(v)),
    retry: false,
    onSuccess: async () => {
      setSubmitError(null);
      setListMode(false);
      setId(null);
      reset();
      await client.invalidateQueries({ queryKey: queryKeys.otecCompliance.resolutions.lists() });
    },
    onError: async (error) => {
      setSubmitError(getErrorMessage(error));
      await detail.refetch();
    },
  });
  if (!canRead)
    return (
      <ErrorState
        title="Acceso restringido"
        description="No tienes permisos para consultar resoluciones OTEC."
      />
    );
  if (list.isLoading) return <LoadingSkeleton />;
  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        Configuración / OTEC Compliance / Resoluciones
      </nav>
      <OtecNavigation />
      <PageHeader
        title="Resoluciones OTEC"
        description="Antecedentes regulatorios internos."
        icon={FileCheck2}
      />
      {listMode ? (
        <Card className="p-5">
          <h2 className="font-semibold">{id ? 'Editar' : 'Crear'} resolución</h2>
          <form
            className="mt-4 grid gap-4 sm:grid-cols-2"
            onSubmit={(e) => void handleSubmit((v) => mutation.mutate(v))(e)}
          >
            {submitError ? (
              <p role="alert" className="sm:col-span-2 text-sm text-destructive">
                {submitError}
              </p>
            ) : null}
            <FormField label="Tipo" htmlFor="resolutionType">
              <select
                id="resolutionType"
                className="h-10 rounded-md border bg-background px-3"
                {...register('resolutionType')}
              >
                {[
                  'ACCREDITATION',
                  'AUTHORIZATION',
                  'MODIFICATION',
                  'SUSPENSION',
                  'CESSATION',
                  'OTHER',
                ].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </FormField>
            {[
              ['Número', 'resolutionNumber'],
              ['Autoridad emisora', 'issuingAuthority'],
              ['Fecha de emisión', 'issuedAt'],
              ['Válida desde', 'validFrom'],
              ['Válida hasta', 'validUntil'],
              ['Alcance', 'scope'],
              ['Documento', 'documentId'],
              ['Notas', 'notes'],
            ].map(([l, n]) => (
              <FormField key={n} label={l} htmlFor={n} error={(errors as any)[n]?.message}>
                <Input
                  id={n}
                  type={
                    n.includes('At') || n.includes('From') || n.includes('Until') ? 'date' : 'text'
                  }
                  {...register(n as keyof ResolutionForm)}
                />
              </FormField>
            ))}
            <div className="sm:col-span-2 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setListMode(false)}>
                Cancelar
              </Button>
              <Button disabled={mutation.isPending}>Guardar</Button>
            </div>
          </form>
        </Card>
      ) : (
        <>
          <Button
            disabled={!profile.profileId || !canManage}
            onClick={() => {
              setId(null);
              reset(defaults);
              setListMode(true);
            }}
          >
            Crear resolución
          </Button>
          <div className="grid gap-4">
            {list.data?.data.map((r) => (
              <Card key={r.id} className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                  <div>
                    <h2 className="font-semibold">{r.resolutionNumber}</h2>
                    <p>
                      {r.resolutionType} · {r.issuingAuthority}
                    </p>
                    <StatusBadge status={r.status} />
                  </div>
                  <Button variant="outline" onClick={() => setId(r.id)}>
                    Ver detalle
                  </Button>
                </div>
              </Card>
            ))}
          </div>
          {id && detail.data ? (
            <Card className="p-5">
              <h2 className="font-semibold">Detalle {detail.data.record.resolutionNumber}</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  disabled={!canManage}
                  onClick={() => {
                    const r = detail.data!.record;
                    reset({
                      resolutionType: r.resolutionType as any,
                      resolutionNumber: r.resolutionNumber,
                      issuingAuthority: r.issuingAuthority,
                      issuedAt: r.issuedAt.slice(0, 10),
                      validFrom: r.validFrom?.slice(0, 10) ?? '',
                      validUntil: r.validUntil?.slice(0, 10) ?? '',
                      scope: r.scope ?? '',
                      documentId: r.documentId ?? '',
                      notes: r.notes ?? '',
                    });
                    setListMode(true);
                  }}
                >
                  Editar
                </Button>
                <Button
                  variant="destructive"
                  disabled={!canManage}
                  onClick={() => setConfirmation({ type: 'deactivate' })}
                >
                  Desactivar
                </Button>
                {list
                  .data!.data.filter((r) => r.id !== id && r.status === 'ACTIVE')
                  .map((r) => (
                    <Button
                      key={r.id}
                      disabled={!canManage}
                      onClick={() =>
                        setConfirmation({
                          type: 'supersede',
                          replacementId: r.id,
                          label: r.resolutionNumber,
                        })
                      }
                    >
                      Reemplazar por {r.resolutionNumber}
                    </Button>
                  ))}
              </div>
            </Card>
          ) : null}
          <Dialog
            open={Boolean(confirmation)}
            onOpenChange={(open) => {
              if (!open) setConfirmation(null);
            }}
          >
            <DialogPortal>
              <DialogOverlay className="fixed inset-0 z-50 bg-black/50" />
              <DialogContent className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-background p-6 shadow-lg">
                <DialogTitle className="text-lg font-semibold">
                  Confirmar cambio regulatorio
                </DialogTitle>
                <DialogDescription className="mt-2 text-sm text-muted-foreground">
                  {confirmation?.type === 'deactivate'
                    ? 'La resolución dejará de estar activa.'
                    : `La resolución será reemplazada por ${confirmation?.label ?? ''}.`}
                </DialogDescription>
                <div className="mt-6 flex justify-end gap-2">
                  <DialogClose asChild>
                    <Button variant="outline">Cancelar</Button>
                  </DialogClose>
                  <Button
                    variant={confirmation?.type === 'deactivate' ? 'destructive' : 'default'}
                    onClick={async () => {
                      if (!id || !detail.data?.etag || !confirmation) return;
                      try {
                        if (confirmation.type === 'deactivate')
                          await deactivateResolution({ id, etag: detail.data.etag });
                        else {
                          const replacement = await getResolution(confirmation.replacementId);
                          await supersedeResolution({
                            id,
                            etag: detail.data.etag,
                            replacementResolutionId: confirmation.replacementId,
                            replacementIfMatch: replacement.etag!,
                          });
                        }
                        setConfirmation(null);
                        setId(null);
                        await client.invalidateQueries({
                          queryKey: queryKeys.otecCompliance.resolutions.lists(),
                        });
                      } catch (error) {
                        setSubmitError(getErrorMessage(error));
                        setConfirmation(null);
                        await detail.refetch();
                      }
                    }}
                  >
                    Confirmar
                  </Button>
                </div>
              </DialogContent>
            </DialogPortal>
          </Dialog>
        </>
      )}
      <p className="text-sm text-muted-foreground">
        Información interna; no representa validación oficial.
      </p>
    </div>
  );
}
