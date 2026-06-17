'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Award, BadgeCheck, FileClock, ShieldCheck } from 'lucide-react';

import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { LoadingSkeleton } from '@/components/feedback/loading-skeleton';
import { StatusBadge } from '@/components/feedback/status-badge';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/layout/page-header';
import { SectionCard } from '@/components/layout/section-card';
import { StatCard } from '@/components/dashboard/stat-card';
import { DataTable } from '@/components/tables/data-table';
import { Button } from '@/components/ui/button';
import { useCertificates, useIssueCertificate } from '@/hooks/use-certificates';
import { useEnrollments } from '@/hooks/use-enrollments';
import { formatDate } from '@/lib/utils/format';
import { useAuthStore } from '@/stores/auth-store';
import type { Certificate } from '@/types/resources';

export default function CertificatesPage() {
  const organizationId = useAuthStore((state) => state.user?.organizationId);
  const certificatesQuery = useCertificates({ page: 1, pageSize: 100, organizationId });
  const enrollmentsQuery = useEnrollments({ page: 1, pageSize: 100, organizationId });
  const issueCertificate = useIssueCertificate();
  const certificates = certificatesQuery.data?.data ?? [];
  const enrollments = enrollmentsQuery.data?.data ?? [];
  const issued = certificates.filter((certificate) => certificate.status === 'ISSUED').length;
  const revoked = certificates.filter((certificate) => certificate.status === 'REVOKED').length;
  const eligibleEnrollment = enrollments.find((enrollment) => enrollment.status === 'COMPLETED') ?? enrollments[0];

  async function issueFromEnrollment() {
    if (!eligibleEnrollment) {
      return;
    }

    await issueCertificate.mutateAsync({ enrollmentId: eligibleEnrollment.id });
  }

  const columns: Array<ColumnDef<Certificate>> = [
    { accessorKey: 'certificateNumber', header: 'Certificate number' },
    { accessorKey: 'employeeId', header: 'Employee' },
    { accessorKey: 'trainingSessionId', header: 'Session' },
    {
      accessorKey: 'issuedAt',
      header: 'Issued',
      cell: ({ row }) => formatDate(row.original.issuedAt),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Certificates"
          description="Issue, verify and monitor certificate eligibility across completed training sessions."
          action={
            <Button onClick={() => void issueFromEnrollment()} disabled={issueCertificate.isPending || !eligibleEnrollment}>
              {issueCertificate.isPending ? 'Issuing...' : 'Issue certificate'}
            </Button>
          }
          icon={Award}
        />
        <section className="grid gap-4 md:grid-cols-3">
          <StatCard title="Issued" value={String(issued)} change="Live certificate records" tone="emerald" icon={BadgeCheck} />
          <StatCard title="Eligibility source" value={String(enrollments.length)} change="Enrollment records available" tone="amber" icon={FileClock} />
          <StatCard title="Revoked" value={String(revoked)} change="Revocation state from backend" tone="rose" icon={ShieldCheck} />
        </section>
        <SectionCard title="Certificates overview" description="Issued certificates with verification codes and lifecycle state.">
          {certificatesQuery.isLoading ? <LoadingSkeleton /> : null}
          {certificatesQuery.isError ? <ErrorState onAction={() => void certificatesQuery.refetch()} /> : null}
          {!certificatesQuery.isLoading && !certificatesQuery.isError && certificates.length > 0 ? <DataTable columns={columns} data={certificates} /> : null}
          {!certificatesQuery.isLoading && !certificatesQuery.isError && certificates.length === 0 ? (
            <EmptyState icon={Award} title="No certificates found" description="Issue certificates once completion, attendance and evaluation requirements are satisfied." actionLabel="Issue certificate" />
          ) : null}
        </SectionCard>
      </div>
    </AppShell>
  );
}
