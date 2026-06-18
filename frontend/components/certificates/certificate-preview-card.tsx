import { Award, ExternalLink, QrCode } from 'lucide-react';

import { StatusBadge } from '@/components/feedback/status-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatReference } from '@/lib/formatters/status';
import { formatDate } from '@/lib/utils/format';

interface CertificatePreviewCardProps {
  certificateNumber: string;
  verificationCode: string;
  status: string;
  issuedAt: string;
  employeeName: string;
  courseName: string;
  organizationName: string;
}

export function CertificatePreviewCard({
  certificateNumber,
  verificationCode,
  status,
  issuedAt,
  employeeName,
  courseName,
  organizationName,
}: Readonly<CertificatePreviewCardProps>) {
  return (
    <Card className="overflow-hidden">
      <div className="grid gap-0 lg:grid-cols-[1fr_260px]">
        <div className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-primary">SkillFlow AI</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-normal">Certificado de Capacitación</h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Este certificado puede ser validado mediante código de verificación.
              </p>
            </div>
            <StatusBadge status={status} />
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <CertificateField label="Colaborador" value={employeeName} />
            <CertificateField label="Curso" value={courseName} />
            <CertificateField label="Fecha de emisión" value={formatDate(issuedAt)} />
            <CertificateField label="Organización" value={organizationName} />
            <CertificateField label="Número certificado" value={formatReference(certificateNumber)} />
            <CertificateField label="Código verificación" value={formatReference(verificationCode)} />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button type="button" variant="outline">
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              Verificar certificado
            </Button>
            <span className="inline-flex items-center rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              Evidencia digital preparada para auditoría interna.
            </span>
          </div>
        </div>

        <div className="border-t bg-muted/35 p-6 lg:border-l lg:border-t-0">
          <div className="flex h-full min-h-56 flex-col items-center justify-center rounded-md border bg-background p-5 text-center">
            <div className="grid h-28 w-28 place-items-center rounded-md border bg-card">
              <QrCode className="h-16 w-16 text-primary" aria-hidden="true" />
            </div>
            <div className="mt-5 flex items-center gap-2 text-sm font-semibold">
              <Award className="h-4 w-4 text-primary" aria-hidden="true" />
              Código verificable
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Placeholder visual. No representa un QR real.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

function CertificateField({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
