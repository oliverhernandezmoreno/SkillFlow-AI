import { randomUUID } from 'node:crypto';

import { AggregateRoot } from '../../../../domain/shared/aggregate-root.js';
import { BadRequestError } from '../../../../shared/domain/errors.js';

export type CertificateStatus = 'DRAFT' | 'ISSUED' | 'REVOKED' | 'EXPIRED';

export interface CertificateProps {
  id: string;
  organizationId: string;
  enrollmentId: string | null;
  employeeId: string;
  courseId: string;
  trainingSessionId: string;
  certificateNumber: string;
  verificationCode: string;
  status: CertificateStatus;
  issuedAt: Date;
  expiresAt: Date | null;
  revokedAt: Date | null;
  revokedReason: string | null;
  fileUrl: string | null;
  documentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  version: number;
}

export class Certificate extends AggregateRoot<string> {
  private constructor(private readonly props: CertificateProps) {
    super(props.id);
  }

  static issue(input: {
    organizationId: string;
    enrollmentId: string;
    employeeId: string;
    courseId: string;
    trainingSessionId: string;
    certificateNumber: string;
    verificationCode: string;
    expiresAt?: Date | null | undefined;
  }): Certificate {
    const now = new Date();

    return new Certificate({
      id: randomUUID(),
      organizationId: input.organizationId,
      enrollmentId: input.enrollmentId,
      employeeId: input.employeeId,
      courseId: input.courseId,
      trainingSessionId: input.trainingSessionId,
      certificateNumber: input.certificateNumber,
      verificationCode: input.verificationCode,
      status: 'ISSUED',
      issuedAt: now,
      expiresAt: input.expiresAt ?? null,
      revokedAt: null,
      revokedReason: null,
      fileUrl: null,
      documentId: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1,
    });
  }

  static rehydrate(props: CertificateProps): Certificate {
    return new Certificate(props);
  }

  revoke(reason: string): void {
    if (this.props.status === 'REVOKED') {
      throw new BadRequestError('Certificate is already revoked');
    }
    if (this.props.deletedAt) {
      throw new BadRequestError('Deleted certificates cannot be revoked');
    }

    this.props.status = 'REVOKED';
    this.props.revokedAt = new Date();
    this.props.revokedReason = reason;
    this.props.updatedAt = new Date();
    this.props.version += 1;
  }

  attachDocument(documentId: string, fileUrl: string | null): void {
    this.props.documentId = documentId;
    this.props.fileUrl = fileUrl;
    this.props.updatedAt = new Date();
    this.props.version += 1;
  }

  toPrimitives(): CertificateProps {
    return { ...this.props };
  }
}
