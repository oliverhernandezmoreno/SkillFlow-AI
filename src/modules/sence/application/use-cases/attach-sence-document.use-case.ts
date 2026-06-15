import { NoopAuditLogger, type AuditLogger } from '../../../../shared/application/audit-logger.js';
import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { NotFoundError } from '../../../../shared/domain/errors.js';
import { SenceDocument } from '../../domain/entities/sence-document.entity.js';
import type { SenceRepository } from '../../domain/repositories/sence.repository.js';
import type { AttachSenceDocumentDto, SenceDocumentDto } from '../dto/sence.dto.js';
import { SenceMapper } from '../mappers/sence.mapper.js';
import { loadSenceDeclaration, requireOrganizationId } from './sence-use-case.helpers.js';

export class AttachSenceDocumentUseCase {
  constructor(
    private readonly repository: SenceRepository,
    private readonly auditLogger: AuditLogger = new NoopAuditLogger(),
  ) {}

  async execute(
    declarationId: string,
    input: AttachSenceDocumentDto,
    context: UseCaseContext = anonymousUseCaseContext,
  ): Promise<SenceDocumentDto> {
    const organizationId = requireOrganizationId(context);
    await loadSenceDeclaration({ repository: this.repository, declarationId, organizationId });
    if (!(await this.repository.documentExists(organizationId, input.documentId))) {
      throw new NotFoundError('Document not found');
    }
    const document = SenceDocument.create({
      organizationId,
      senceDeclarationId: declarationId,
      documentId: input.documentId,
      documentType: input.documentType ?? null,
    });
    await this.repository.attachDocument(document);
    await this.auditLogger.record({
      organizationId,
      actorUserId: context.actorUserId,
      entityType: 'SENCE_DECLARATION',
      entityId: declarationId,
      action: 'sence.document.attach',
      metadata: { documentId: input.documentId, documentType: input.documentType ?? null },
      after: document.toPrimitives(),
      ipAddress: context.ipAddress ?? null,
      userAgent: context.userAgent ?? null,
    });
    return SenceMapper.toDocumentDto(document);
  }
}
