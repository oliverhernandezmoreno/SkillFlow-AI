import type { PaginatedResult } from '../../../../shared/application/pagination.js';
import type { Certificate } from '../../domain/entities/certificate.entity.js';
import type {
  CertificateDocumentDto,
  CertificateDto,
  CertificateListDto,
  CertificateVerificationDto,
} from '../dto/certificate.dto.js';

export class CertificateMapper {
  static toDto(certificate: Certificate): CertificateDto {
    const props = certificate.toPrimitives();

    return {
      id: props.id,
      organizationId: props.organizationId,
      enrollmentId: props.enrollmentId,
      employeeId: props.employeeId,
      courseId: props.courseId,
      trainingSessionId: props.trainingSessionId,
      certificateNumber: props.certificateNumber,
      verificationCode: props.verificationCode,
      status: props.status,
      issuedAt: props.issuedAt.toISOString(),
      expiresAt: props.expiresAt?.toISOString() ?? null,
      revokedAt: props.revokedAt?.toISOString() ?? null,
      revokedReason: props.revokedReason,
      fileUrl: props.fileUrl,
      documentId: props.documentId,
      createdAt: props.createdAt.toISOString(),
      updatedAt: props.updatedAt.toISOString(),
    };
  }

  static toListDto(result: PaginatedResult<Certificate>): CertificateListDto {
    return {
      data: result.data.map((certificate) => this.toDto(certificate)),
      meta: result.meta,
    };
  }

  static toVerificationDto(certificate: Certificate | null): CertificateVerificationDto {
    if (!certificate) {
      return {
        valid: false,
        status: null,
        certificateNumber: null,
        issuedAt: null,
        expiresAt: null,
        courseId: null,
        trainingSessionId: null,
      };
    }

    const props = certificate.toPrimitives();
    const expired = props.expiresAt !== null && props.expiresAt.getTime() < Date.now();
    const valid = props.status === 'ISSUED' && !expired && !props.deletedAt;

    return {
      valid,
      status: props.status,
      certificateNumber: props.certificateNumber,
      issuedAt: props.issuedAt.toISOString(),
      expiresAt: props.expiresAt?.toISOString() ?? null,
      courseId: props.courseId,
      trainingSessionId: props.trainingSessionId,
    };
  }

  static toDocumentDto(input: {
    certificateId: string;
    document: {
      id: string;
      fileName: string;
      fileUrl: string | null;
      mimeType: string | null;
      storageKey: string | null;
    };
  }): CertificateDocumentDto {
    return {
      id: input.document.id,
      certificateId: input.certificateId,
      fileName: input.document.fileName,
      fileUrl: input.document.fileUrl,
      mimeType: input.document.mimeType,
      storageKey: input.document.storageKey,
      status: 'GENERATED',
    };
  }
}
