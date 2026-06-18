'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { FileCheck2, Landmark, ShieldCheck, TriangleAlert } from 'lucide-react';
import { Suspense, useMemo } from 'react';

import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { LoadingSkeleton } from '@/components/feedback/loading-skeleton';
import { StatusBadge } from '@/components/feedback/status-badge';
import { useToast } from '@/components/feedback/toast-provider';
import { FilterBar } from '@/components/forms/filter-bar';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/layout/page-header';
import { SectionCard } from '@/components/layout/section-card';
import { SenceEvidenceChecklist, type EvidenceChecklistItem } from '@/components/sence/sence-evidence-checklist';
import { StatCard } from '@/components/dashboard/stat-card';
import { DataTable } from '@/components/tables/data-table';
import { Button } from '@/components/ui/button';
import { useApiErrorToast } from '@/hooks/use-api-error-toast';
import { useAttendance } from '@/hooks/use-attendance';
import { useCertificates } from '@/hooks/use-certificates';
import { useEnrollments } from '@/hooks/use-enrollments';
import { useEvaluations } from '@/hooks/use-evaluations';
import { usePersistentFilters } from '@/hooks/use-persistent-filters';
import { useCreateSenceDeclaration, useSenceActions, useSenceDeclarations } from '@/hooks/use-sence';
import { useTrainingSessions } from '@/hooks/use-training-sessions';
import { formatReference, formatStatus } from '@/lib/formatters/status';
import { formatCurrency } from '@/lib/utils/format';
import { useAuthStore } from '@/stores/auth-store';
import type { SenceDeclaration } from '@/types/resources';

export default function SencePage() {
  return (
    <AppShell>
      <Suspense fallback={<LoadingSkeleton />}>
        <SencePageContent />
      </Suspense>
    </AppShell>
  );
}

function SencePageContent() {
  const defaultFilters = useMemo(
    () => ({
      page: 1,
      pageSize: 100,
      status: '',
    }),
    [],
  );
  const [filters, setFilters] = usePersistentFilters('skillflow-filters-sence', defaultFilters);
  const organizationId = useAuthStore((state) => state.user?.organizationId);
  const attendanceQuery = useAttendance({ page: 1, pageSize: 100, organizationId });
  const certificatesQuery = useCertificates({ page: 1, pageSize: 100, organizationId });
  const declarationsQuery = useSenceDeclarations({ ...filters, organizationId });
  const enrollmentsQuery = useEnrollments({ page: 1, pageSize: 100, organizationId });
  const evaluationsQuery = useEvaluations({ page: 1, pageSize: 100, organizationId });
  const sessionsQuery = useTrainingSessions({ page: 1, pageSize: 100, organizationId });
  const createDeclaration = useCreateSenceDeclaration();
  const senceActions = useSenceActions();
  const { showToast } = useToast();
  const showApiError = useApiErrorToast();
  const attendanceRecords = attendanceQuery.data?.data ?? [];
  const certificates = certificatesQuery.data?.data ?? [];
  const declarations = declarationsQuery.data?.data ?? [];
  const enrollments = enrollmentsQuery.data?.data ?? [];
  const evaluations = evaluationsQuery.data?.data ?? [];
  const sessions = sessionsQuery.data?.data ?? [];
  const ready = declarations.filter((declaration) => declaration.status === 'READY').length;
  const missingEvidence = declarations.filter((declaration) => ['DRAFT', 'OBSERVED', 'REJECTED'].includes(declaration.status)).length;
  const projectedCredit = declarations.reduce((total, declaration) => total + (declaration.taxCreditAmount ?? 0), 0);
  const sessionById = new Map(sessions.map((session) => [session.id, session.name]));
  const selectedDeclaration = declarations[0];
  const selectedSessionId = selectedDeclaration?.trainingSessionId ?? sessions[0]?.id ?? null;
  const selectedSessionEnrollments = enrollments.filter((enrollment) => enrollment.trainingSessionId === selectedSessionId);
  const selectedSessionAttendance = attendanceRecords.filter((record) => record.trainingSessionId === selectedSessionId);
  const selectedSessionEvaluations = evaluations.filter((evaluation) => evaluation.trainingSessionId === selectedSessionId);
  const selectedSessionCertificates = certificates.filter((certificate) => certificate.trainingSessionId === selectedSessionId);
  const declarationIsObserved = selectedDeclaration ? ['OBSERVED', 'REJECTED'].includes(selectedDeclaration.status) : false;
  const declarationIsReady = selectedDeclaration ? ['READY', 'SUBMITTED', 'ACCEPTED'].includes(selectedDeclaration.status) : false;
  const evidenceChecklist: EvidenceChecklistItem[] = [
    {
      label: 'Sesión registrada',
      description: selectedSessionId ? (sessionById.get(selectedSessionId) ?? formatReference(selectedSessionId)) : 'No hay sesión seleccionada.',
      status: selectedSessionId ? 'complete' : 'pending',
    },
    {
      label: 'Participantes inscritos',
      description: `${selectedSessionEnrollments.length} inscripción(es) asociadas a la sesión.`,
      status: selectedSessionEnrollments.length > 0 ? 'complete' : 'pending',
    },
    {
      label: 'Asistencia registrada',
      description: `${selectedSessionAttendance.length} registro(s) de asistencia encontrados.`,
      status: selectedSessionAttendance.length > 0 ? 'complete' : 'pending',
    },
    {
      label: 'Evaluaciones disponibles',
      description: `${selectedSessionEvaluations.length} evaluación(es) asociadas.`,
      status: selectedSessionEvaluations.length > 0 ? 'complete' : 'pending',
    },
    {
      label: 'Certificados emitidos',
      description: `${selectedSessionCertificates.length} certificado(s) emitidos para la sesión.`,
      status: selectedSessionCertificates.length > 0 ? 'complete' : 'pending',
    },
    {
      label: 'Evidencia documental',
      description: 'Documentos adjuntos y respaldos se validan antes de presentar la declaración.',
      status: declarationIsObserved ? 'observed' : selectedSessionCertificates.length > 0 ? 'complete' : 'pending',
    },
    {
      label: 'Declaración lista para revisión',
      description: selectedDeclaration ? `Estado actual: ${formatStatus(selectedDeclaration.status)}` : 'Crea una declaración para iniciar revisión.',
      status: declarationIsObserved ? 'observed' : declarationIsReady ? 'complete' : 'pending',
    },
  ];

  async function createFromFirstSession() {
    if (!sessions[0]) {
      return;
    }

    try {
      await createDeclaration.mutateAsync({ trainingSessionId: sessions[0].id });
      showToast({ title: 'Declaración SENCE creada', description: 'La declaración está lista para validación.', tone: 'success' });
    } catch (error) {
      showApiError(error, 'No se pudo crear la declaración SENCE');
    }
  }

  async function runSenceAction(action: 'validate' | 'ready' | 'submit', declarationId: string) {
    try {
      await senceActions[action].mutateAsync(declarationId);
      showToast({
        title: action === 'validate' ? 'Validación SENCE completa' : action === 'ready' ? 'Declaración marcada como lista' : 'Declaración enviada',
        description: 'El estado de la declaración fue actualizado en el backend.',
        tone: 'success',
      });
    } catch (error) {
      showApiError(error, 'La acción SENCE falló');
    }
  }

  const columns: Array<ColumnDef<SenceDeclaration>> = [
    {
      accessorKey: 'trainingSessionId',
      header: 'Sesión',
      cell: ({ row }) => sessionById.get(row.original.trainingSessionId) ?? formatReference(row.original.trainingSessionId),
    },
    { accessorKey: 'senceCode', header: 'Código SENCE' },
    {
      accessorKey: 'taxCreditAmount',
      header: 'Crédito tributario',
      cell: ({ row }) => formatCurrency(row.original.taxCreditAmount ?? 0),
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex flex-wrap justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => void runSenceAction('validate', row.original.id)}>
            Validar
          </Button>
          <Button size="sm" variant="outline" onClick={() => void runSenceAction('ready', row.original.id)}>
            Lista
          </Button>
          <Button size="sm" variant="outline" onClick={() => void runSenceAction('submit', row.original.id)}>
            Enviar
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
        <PageHeader
          title="SENCE"
          description="Prepara evidencia, crédito tributario y cumplimiento para flujos SENCE."
          action={
            <Button onClick={() => void createFromFirstSession()} disabled={createDeclaration.isPending || sessions.length === 0}>
              {createDeclaration.isPending ? 'Creando...' : 'Crear declaración'}
            </Button>
          }
          icon={FileCheck2}
        />
        <section className="grid gap-4 md:grid-cols-3">
          <StatCard title="Declaraciones listas" value={String(ready)} change="Preparadas para envío" tone="cyan" icon={ShieldCheck} />
          <StatCard title="Crédito proyectado" value={formatCurrency(projectedCredit)} change="Valor elegible declarado" tone="emerald" icon={Landmark} />
          <StatCard title="Requieren evidencia" value={String(missingEvidence)} change="Borrador, observada o rechazada" tone="rose" icon={TriangleAlert} />
        </section>
        <FilterBar
          statusValue={filters.status}
          statusOptions={['DRAFT', 'READY', 'SUBMITTED', 'ACCEPTED', 'REJECTED', 'OBSERVED']}
          onStatusChange={(status) => setFilters({ status, page: 1 })}
        />
        <SenceEvidenceChecklist items={evidenceChecklist} />

        <SectionCard title="Asistente de declaraciones SENCE" description="Valida y prepara declaraciones mediante acciones del backend. No representa envío oficial automático.">
          {declarationsQuery.isLoading ? <LoadingSkeleton /> : null}
          {declarationsQuery.isError ? <ErrorState onAction={() => void declarationsQuery.refetch()} /> : null}
          {!declarationsQuery.isLoading && !declarationsQuery.isError && declarations.length > 0 ? <DataTable columns={columns} data={declarations} /> : null}
          {!declarationsQuery.isLoading && !declarationsQuery.isError && declarations.length === 0 ? (
            <EmptyState icon={FileCheck2} title="No se encontraron declaraciones SENCE" description="Crea una declaración desde una sesión para preparar validaciones y evidencia." actionLabel="Crear declaración" />
          ) : null}
        </SectionCard>
    </div>
  );
}
