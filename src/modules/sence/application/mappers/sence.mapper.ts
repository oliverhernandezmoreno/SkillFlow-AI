import type { PaginatedResult } from '../../../../shared/application/pagination.js';
import type { SenceDeclaration } from '../../domain/entities/sence-declaration.entity.js';
import type { SenceDocument } from '../../domain/entities/sence-document.entity.js';
import type {
  SenceDeclarationDto,
  SenceDeclarationListDto,
  SenceDocumentDto,
  SenceDocumentListDto,
} from '../dto/sence.dto.js';

export class SenceMapper {
  static toDto(declaration: SenceDeclaration): SenceDeclarationDto {
    const props = declaration.toPrimitives();

    return {
      id: props.id,
      organizationId: props.organizationId,
      trainingSessionId: props.trainingSessionId,
      senceCode: props.senceCode,
      status: props.status,
      declaredAmount: props.declaredAmount,
      taxCreditAmount: props.taxCreditAmount,
      externalCode: props.externalCode,
      submittedAt: props.submittedAt?.toISOString() ?? null,
      responsePayload: props.responsePayload,
      createdAt: props.createdAt.toISOString(),
      updatedAt: props.updatedAt.toISOString(),
    };
  }

  static toListDto(result: PaginatedResult<SenceDeclaration>): SenceDeclarationListDto {
    return {
      data: result.data.map((declaration) => this.toDto(declaration)),
      meta: result.meta,
    };
  }

  static toDocumentDto(document: SenceDocument): SenceDocumentDto {
    const props = document.toPrimitives();
    return {
      id: props.id,
      organizationId: props.organizationId,
      senceDeclarationId: props.senceDeclarationId,
      documentId: props.documentId,
      documentType: props.documentType,
      createdAt: props.createdAt.toISOString(),
      updatedAt: props.updatedAt.toISOString(),
    };
  }

  static toDocumentListDto(documents: SenceDocument[]): SenceDocumentListDto {
    return { data: documents.map((document) => this.toDocumentDto(document)) };
  }
}
