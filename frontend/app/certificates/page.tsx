'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Award, BadgeCheck, FileClock, ShieldCheck } from 'lucide-react';
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
import { StatCard } from '@/components/dashboard/stat-card';
import { DataTable } from '@/components/tables/data-table';
import { Button } from '@/components/ui/button';
import { useApiErrorToast } from '@/hooks/use-api-error-toast';
import { useCertificates, useIssueCertificate } from '@/hooks/use-certificates';
import { useEnrollments } from '@/hooks/use-enrollments';
import { usePersistentFilters } from '@/hooks/use-persistent-filters';
import { formatDate } from '@/lib/utils/format';
import { useAuthStore } from '@/stores/auth-store';
import type { Certificate } from '@/types/resources';

export default function CertificatesPage() {
  return (
    <AppShell>
      <Suspense fallback={<LoadingSkeleton />}>
        <CertificatesPageContent />
      </Suspense>
    </AppShell>
  );
}

function CertificatesPageContent() {
  const defaultFilters = useMemo(
    () => ({
      page: 1,
      pageSize: 100,
      status: '',
    }),
    [],
  );
  const [filters, setFilters] = usePersistentFilters('skillflow-filters-certificates', defaultFilters);
  const organizationId = useAuthStore((state) => state.user?.organizationId);
  const certificatesQuery = useCertificates({ ...filters, organizationId });
  const enrollmentsQuery = useEnrollments({ page: 1, pageSize: 100, organizationId });
  const issueCertificate = useIssueCertificate();
  const { showToast } = useToast();
  const showApiError = useApiErrorToast();
  const certificates = certificatesQuery.data?.data ?? [];
  const enrollments = enrollmentsQuery.data?.data ?? [];
  const issued = certificates.filter((certificate) => certificate.status === 'ISSUED').length;
  const revoked = certificates.filter((certificate) => certificate.status === 'REVOKED').length;
  const eligibleEnrollment = enrollments.find((enrollment) => enrollment.status === 'COMPLETED') ?? enrollments[0];

  async function issueFromEnrollment() {
    if (!eligibleEnrollment) {
      return;
    }

    try {
      await issueCertificate.mutateAsync({ enrollmentId: eligibleEnrollment.id });
      showToast({ title: 'Certificado emitido', description: 'El certificado fue creado y puede verificarse.', tone: 'success' });
    } catch (error) {
      showApiError(error, 'No se pudo emitir el certificado');
    }
  }

  const columns: Array<ColumnDef<Certificate>> = [
    { accessorKey: 'certificateNumber', header: 'Número de certificado' },
    { accessorKey: 'employeeId', header: 'Colaborador' },
    { accessorKey: 'trainingSessionId', header: 'Sesión' },
    {
      accessorKey: 'issuedAt',
      header: 'Emisión',
      cell: ({ row }) => formatDate(row.original.issuedAt),
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
  ];

  return (
    <div className="space-y-6">
        <PageHeader
          title="Certificados"
          description="Emite, verifica y monitorea elegibilidad de certificados en sesiones finalizadas."
          action={
            <Button onClick={() => void issueFromEnrollment()} disabled={issueCertificate.isPending || !eligibleEnrollment}>
              {issueCertificate.isPending ? 'Emitiendo...' : 'Emitir certificado'}
            </Button>
          }
          icon={Award}
        />
        <section className="grid gap-4 md:grid-cols-3">
          <StatCard title="Emitidos" value={String(issued)} change="Registros de certificados en vivo" tone="emerald" icon={BadgeCheck} />
          <StatCard title="Fuente elegible" value={String(enrollments.length)} change="Inscripciones disponibles" tone="amber" icon={FileClock} />
          <StatCard title="Revocados" value={String(revoked)} change="Estado de revocación backend" tone="rose" icon={ShieldCheck} />
        </section>
        <FilterBar
          statusValue={filters.status}
          statusOptions={['DRAFT', 'ISSUED', 'REVOKED', 'EXPIRED']}
          onStatusChange={(status) => setFilters({ status, page: 1 })}
        />
        <SectionCard title="Vista de certificados" description="Certificados emitidos con códigos de verificación y estado.">
          {certificatesQuery.isLoading ? <LoadingSkeleton /> : null}
          {certificatesQuery.isError ? <ErrorState onAction={() => void certificatesQuery.refetch()} /> : null}
          {!certificatesQuery.isLoading && !certificatesQuery.isError && certificates.length > 0 ? <DataTable columns={columns} data={certificates} /> : null}
          {!certificatesQuery.isLoading && !certificatesQuery.isError && certificates.length === 0 ? (
            <EmptyState icon={Award} title="No se encontraron certificados" description="Emite certificados cuando se cumplan requisitos de avance, asistencia y evaluación." actionLabel="Emitir certificado" />
          ) : null}
        </SectionCard>
    </div>
  );
}
