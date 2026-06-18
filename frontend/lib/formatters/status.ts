const statusLabelMap: Record<string, string> = {
  ACCEPTED: 'Aceptado',
  ACTIVE: 'Activo',
  ABSENT: 'Ausente',
  ARCHIVED: 'Archivado',
  ASYNC: 'Asincrónico',
  BLENDED: 'Mixto',
  CANCELLED: 'Cancelado',
  CLOSED: 'Cerrado',
  COMPLETED: 'Completado',
  CONFIRMED: 'Confirmado',
  CRITICAL: 'Crítico',
  DIGITAL_SIGNATURE: 'Firma digital',
  DRAFT: 'Borrador',
  ENROLLED: 'Inscrito',
  EXCUSED: 'Justificado',
  EXPIRED: 'Expirado',
  FAILED: 'Reprobado',
  HYBRID: 'Híbrido',
  IN_PROGRESS: 'En curso',
  INACTIVE: 'Inactivo',
  INCOMPLETE: 'Incompleto',
  ISSUED: 'Emitido',
  JUSTIFIED: 'Justificado',
  KNOWLEDGE: 'Conocimiento',
  KNOWLEDGE_TEST: 'Prueba de conocimiento',
  LATE: 'Atrasado',
  MANUAL: 'Manual',
  OBSERVED: 'Observado',
  ONLINE: 'Online',
  OPEN: 'Abierto',
  PARTIAL: 'Parcial',
  PASSED: 'Aprobado',
  PENDING: 'Pendiente',
  PRESENTIAL: 'Presencial',
  PRESENT: 'Presente',
  PRACTICAL: 'Práctica',
  PRACTICAL_ASSESSMENT: 'Evaluación práctica',
  PUBLISHED: 'Publicado',
  QR: 'QR',
  READY: 'Listo',
  REJECTED: 'Rechazado',
  REVOKED: 'Revocado',
  SATISFACTION: 'Satisfacción',
  SATISFACTION_SURVEY: 'Encuesta de satisfacción',
  SCHEDULED: 'Programado',
  SUBMITTED: 'Enviado',
  TERMINATED: 'Desvinculado',
  WAITLIST: 'Lista de espera',
  WAITLISTED: 'Lista de espera',
};

export type StatusTone = 'default' | 'muted' | 'cyan' | 'emerald' | 'amber' | 'rose';

const statusToneMap: Record<string, StatusTone> = {
  ACCEPTED: 'emerald',
  ACTIVE: 'emerald',
  COMPLETED: 'emerald',
  CONFIRMED: 'emerald',
  ISSUED: 'emerald',
  PASSED: 'emerald',
  PRESENT: 'emerald',
  PUBLISHED: 'emerald',
  READY: 'cyan',
  SCHEDULED: 'cyan',
  SUBMITTED: 'cyan',
  DRAFT: 'muted',
  INACTIVE: 'muted',
  OPEN: 'cyan',
  PENDING: 'amber',
  WAITLIST: 'amber',
  WAITLISTED: 'amber',
  CANCELLED: 'rose',
  CRITICAL: 'rose',
  FAILED: 'rose',
  OBSERVED: 'rose',
  REJECTED: 'rose',
  REVOKED: 'rose',
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function formatStatus(status: string | null | undefined): string {
  if (!status) {
    return 'Sin estado';
  }

  return statusLabelMap[status] ?? toTitleCase(status);
}

export function getStatusTone(status: string | null | undefined): StatusTone {
  if (!status) {
    return 'muted';
  }

  return statusToneMap[status] ?? 'default';
}

export function formatReference(value: string | null | undefined): string {
  if (!value) {
    return 'Sin referencia';
  }

  if (uuidPattern.test(value)) {
    return `Ref. ${value.slice(0, 6).toUpperCase()}`;
  }

  if (value.length > 24 && /^[a-z0-9-]+$/i.test(value)) {
    return `Ref. ${value.slice(0, 6).toUpperCase()}`;
  }

  return value;
}

export function formatStatusOptions(statusOptions: readonly string[]): Array<{ value: string; label: string }> {
  return statusOptions.map((status) => ({ value: status, label: formatStatus(status) }));
}

function toTitleCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
