'use client';
import { Award, BadgeCheck, Pencil, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import { ErrorState } from '@/components/feedback/error-state';
import { LoadingSkeleton } from '@/components/feedback/loading-skeleton';
import { StatusBadge } from '@/components/feedback/status-badge';
import { useToast } from '@/components/feedback/toast-provider';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogTitle } from '@/components/ui/dialog';
import { getErrorMessage } from '@/lib/api/errors';
import { useAuthStore } from '@/stores/auth-store';
import { useActiveOtecProfileContext } from '../use-active-profile-context';
import { OtecNavigation } from '../otec-navigation';
import { useAccreditation, useAccreditations, useCertification, useCertifications, useRegulatoryMutation } from './hooks';
import { RegulatoryForm } from './regulatory-form';
import { toAccreditationPayload, toCertificationPayload, type AccreditationFormValues, type CertificationFormValues, type OtecAccreditation, type QualityCertification, type RegulatoryFilters } from './schemas';
import * as service from './services';

type Kind = 'accreditation' | 'certification';
const EMPTY_PERMISSIONS: string[] = [];
export function RegulatoryPage({ kind }: Readonly<{ kind: Kind }>) {
  const accreditation = kind === 'accreditation';
  const permissions = useAuthStore((state) => state.user?.permissions ?? EMPTY_PERMISSIONS);
  const canRead = permissions.includes('otec_compliance.read');
  const canManage = permissions.includes(accreditation ? 'otec_compliance.accreditation.manage' : 'otec_compliance.certification.manage');
  const [filters, setFilters] = useState<RegulatoryFilters>({ page: 1, pageSize: 20 });
  const accreditationList = useAccreditations(filters, accreditation);
  const certificationList = useCertifications(filters, !accreditation);
  const list = accreditation ? accreditationList : certificationList;
  const profile = useActiveOtecProfileContext();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const accreditationDetail = useAccreditation(selectedId, accreditation);
  const certificationDetail = useCertification(selectedId, !accreditation);
  const detail = accreditation ? accreditationDetail : certificationDetail;
  const [form, setForm] = useState<'create' | 'edit' | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [transition, setTransition] = useState<'suspend' | 'revoke' | 'deactivate' | null>(null);
  const { showToast } = useToast();
  const save = useRegulatoryMutation(kind, async (values: AccreditationFormValues | CertificationFormValues) => {
    if (form === 'create') {
      const profileId = profile.profileId;
      if (!profileId) throw new Error('Crea primero el perfil OTEC para registrar antecedentes.');
      return accreditation ? service.createAccreditation(profileId, toAccreditationPayload(values as AccreditationFormValues)) : service.createCertification(profileId, toCertificationPayload(values as CertificationFormValues));
    }
    if (!selectedId || !detail.data?.etag) throw new Error('No se recibió una versión ETag. Recarga el registro.');
    return accreditation ? service.updateAccreditation({ id: selectedId, etag: detail.data.etag, input: toAccreditationPayload(values as AccreditationFormValues) }) : service.updateCertification({ id: selectedId, etag: detail.data.etag, input: toCertificationPayload(values as CertificationFormValues) });
  });
  const transitionMutation = useRegulatoryMutation(kind, async () => {
    if (!selectedId || !detail.data?.etag || !transition) throw new Error('No se recibió una versión ETag.');
    if (transition === 'suspend') return service.suspendAccreditation({ id: selectedId, etag: detail.data.etag });
    if (transition === 'revoke') return service.revokeAccreditation({ id: selectedId, etag: detail.data.etag });
    return service.deactivateCertification({ id: selectedId, etag: detail.data.etag });
  });

  async function submit(values: AccreditationFormValues | CertificationFormValues) { setSubmitError(null); try { await save.mutateAsync(values); setForm(null); setSelectedId(null); showToast({ title: accreditation ? 'Acreditación guardada' : 'Certificación guardada', tone: 'success' }); } catch (error) { if ((error as { status?: number }).status === 409) { setSubmitError('El registro fue actualizado por otra sesión. Recuperamos su versión más reciente para evitar sobrescribir cambios. Revisa tu borrador antes de guardar.'); await detail.refetch(); } else setSubmitError(getErrorMessage(error)); } }
  async function confirmTransition() { try { await transitionMutation.mutateAsync(undefined as never); setTransition(null); setSelectedId(null); await detail.refetch(); showToast({ title: 'Estado actualizado', tone: 'success' }); } catch (error) { setTransition(null); if ((error as { status?: number }).status === 409) await detail.refetch(); showToast({ title: 'No se pudo cambiar el estado', description: getErrorMessage(error), tone: 'error' }); } }
  if (!canRead) return <ErrorState title="Sin permiso para consultar OTEC Compliance" description="Tu cuenta no tiene el permiso de lectura requerido." />;
  const error = list.error as { status?: number; payload?: { error?: { code?: string } } } | null;
  if (error?.status === 403 && error.payload?.error?.code === 'MODULE_UNAVAILABLE') return <ErrorState title="Módulo OTEC no disponible" description="El entitlement requerido no está habilitado para esta organización." />;
  if (error?.status === 403) return <ErrorState title="Sin permiso para consultar OTEC Compliance" description="El backend rechazó el acceso." />;
  if (list.isLoading) return <LoadingSkeleton />;
  if (list.error) return <ErrorState description={getErrorMessage(list.error)} onAction={() => void list.refetch()} />;
  const record = detail.data?.record as OtecAccreditation | QualityCertification | undefined;
  const title = accreditation ? 'Acreditaciones' : 'Certificaciones de Calidad';
  const statuses = accreditation ? ['DRAFT', 'ACTIVE', 'SUSPENDED', 'REVOKED', 'CANCELLED'] : ['DRAFT', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'REVOKED', 'CANCELLED'];
  return <div className="space-y-6"><nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">Configuración / OTEC Compliance / {title}</nav><OtecNavigation /><PageHeader title={title} description="Administra antecedentes regulatorios internos del tenant autenticado." icon={accreditation ? Award : BadgeCheck} />
    {form ? <RegulatoryForm kind={kind} record={form === 'edit' ? record : undefined} pending={save.isPending} error={submitError} onCancel={() => setForm(null)} onSubmit={submit} /> : <>
      <Card className="p-4"><div className="grid gap-3 sm:grid-cols-4"><label className="text-sm font-medium">Estado<select aria-label="Estado" className="mt-1 h-10 w-full rounded-md border bg-background px-3" value={filters.status ?? ''} onChange={(event) => setFilters({ ...filters, page: 1, status: event.target.value || undefined })}><option value="">Todos</option>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label>{!accreditation ? <label className="text-sm font-medium">Tipo<select aria-label="Tipo" className="mt-1 h-10 w-full rounded-md border bg-background px-3" value={filters.type ?? ''} onChange={(event) => setFilters({ ...filters, page: 1, type: event.target.value || undefined })}><option value="">Todos</option><option value="NCH_2728">NCh 2728</option><option value="ISO_9001">ISO 9001</option><option value="OTHER">Otra</option></select></label> : null}<label className="text-sm font-medium">Vigente al<input aria-label="Vigente al" type="date" className="mt-1 h-10 w-full rounded-md border bg-background px-3" value={filters.validAt ?? ''} onChange={(event) => setFilters({ ...filters, page: 1, validAt: event.target.value || undefined })} /></label>{canManage ? <Button className="self-end" onClick={() => { setSelectedId(null); setSubmitError(null); setForm('create'); }}>Crear {accreditation ? 'acreditación' : 'certificación'}</Button> : null}</div></Card>
      {!list.data?.data.length ? <Card className="p-8 text-center"><ShieldAlert className="mx-auto h-8 w-8 text-muted-foreground" /><h2 className="mt-3 font-semibold">No hay {accreditation ? 'acreditaciones' : 'certificaciones'} registradas</h2><p className="mt-1 text-sm text-muted-foreground">No existen antecedentes que coincidan con los filtros.</p></Card> : <div className="grid gap-4">{list.data.data.map((item) => <Card key={item.id} className="p-4"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{'accreditationNumber' in item ? item.accreditationNumber : item.certificationNumber}</h2><StatusBadge status={item.status} /></div><p className="mt-1 text-sm text-muted-foreground">{'accreditationType' in item ? item.accreditationType : `${item.certificationType} · ${item.certifyingEntity}`}</p><p className="mt-1 text-sm">Vigencia: {formatDate(item.validFrom)} — {formatDate(item.validUntil)}</p></div><Button variant="outline" onClick={() => setSelectedId(item.id)}>Ver detalle</Button></div></Card>)}</div>}
      <div className="flex items-center justify-between"><Button variant="outline" disabled={filters.page === 1} onClick={() => setFilters({ ...filters, page: filters.page - 1 })}>Anterior</Button><span className="text-sm">Página {list.data?.meta.page ?? 1} de {Math.max(list.data?.meta.totalPages ?? 1, 1)}</span><Button variant="outline" disabled={(list.data?.meta.page ?? 1) >= (list.data?.meta.totalPages ?? 1)} onClick={() => setFilters({ ...filters, page: filters.page + 1 })}>Siguiente</Button></div>
      {selectedId ? <Card className="p-4 sm:p-6">{detail.isLoading ? <LoadingSkeleton /> : record ? <><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-semibold">Detalle</h2><StatusBadge status={record.status} /></div>{canManage ? <div className="flex flex-wrap gap-2">{record.status === 'ACTIVE' ? <Button variant="outline" onClick={() => setForm('edit')}><Pencil className="h-4 w-4" />Editar</Button> : null}{accreditation && record.status === 'ACTIVE' ? <Button variant="outline" onClick={() => setTransition('suspend')}>Suspender</Button> : null}{accreditation && ['ACTIVE', 'SUSPENDED'].includes(record.status) ? <Button variant="destructive" onClick={() => setTransition('revoke')}>Revocar</Button> : null}{!accreditation && record.status === 'ACTIVE' ? <Button variant="destructive" onClick={() => setTransition('deactivate')}>Desactivar</Button> : null}</div> : null}</div><dl className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Número" value={'accreditationNumber' in record ? record.accreditationNumber : record.certificationNumber} /><Field label="Tipo" value={'accreditationType' in record ? record.accreditationType : record.certificationType} /><Field label="Fecha de emisión" value={formatDate(record.issuedAt)} /><Field label="Válida hasta" value={formatDate(record.validUntil)} /><Field label="Notas" value={record.notes ?? 'No informado'} /></dl></> : <ErrorState description={getErrorMessage(detail.error)} />}</Card> : null}
    </>}
    <p className="text-sm text-muted-foreground">Información interna; no representa acreditación, certificación ni validación oficial de SENCE, RUDO, OTIC o LCE.</p>
    <Dialog open={Boolean(transition)} onOpenChange={(open) => { if (!open) setTransition(null); }}><DialogPortal><DialogOverlay className="fixed inset-0 z-50 bg-slate-950/40" /><DialogContent className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-card p-6"><DialogTitle>Confirmar cambio de estado</DialogTitle><DialogDescription className="mt-2 text-sm text-muted-foreground">Esta transición afecta la vigencia del antecedente y se registrará en auditoría.</DialogDescription><div className="mt-6 flex justify-end gap-2"><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button variant="destructive" disabled={transitionMutation.isPending} onClick={() => void confirmTransition()}>Confirmar</Button></div></DialogContent></DialogPortal></Dialog>
  </div>;
}
function Field({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs font-medium uppercase text-muted-foreground">{label}</dt><dd className="mt-1 text-sm font-medium">{value}</dd></div>; }
function formatDate(value: string | null) { return value ? new Intl.DateTimeFormat('es-CL', { timeZone: 'UTC' }).format(new Date(value)) : 'Sin fecha'; }
