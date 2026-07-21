import type { LegalRepresentative } from '../../domain/entities/legal-representative.entity.js';
import type { LegalRepresentativeDto } from '../dto/legal-representative.dto.js';
export class LegalRepresentativeMapper {
  static toDto(entity: LegalRepresentative): LegalRepresentativeDto {
    return entity.toPrimitives();
  }
  static toSafeAudit(entity: LegalRepresentative) {
    const p = entity.toPrimitives();
    return {
      id: p.id,
      otecProfileId: p.otecProfileId,
      taxId: mask(p.taxId),
      email: p.email ? '[REDACTED]' : null,
      phone: p.phone ? mask(p.phone) : null,
      roleTitle: p.roleTitle,
      validFrom: p.validFrom,
      validUntil: p.validUntil,
      active: p.active,
      hasAppointmentDocument: p.appointmentDocumentId !== null,
      version: p.version,
    };
  }
}
function mask(value: string): string {
  const visible = value.slice(-4);
  return `${'*'.repeat(Math.max(4, value.length - visible.length))}${visible}`;
}
