import { randomUUID } from 'node:crypto';

export interface SenceDocumentProps {
  id: string;
  organizationId: string;
  senceDeclarationId: string;
  documentId: string;
  documentType: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  version: number;
}

export class SenceDocument {
  private constructor(private readonly props: SenceDocumentProps) {}

  get id(): string {
    return this.props.id;
  }

  static create(input: {
    organizationId: string;
    senceDeclarationId: string;
    documentId: string;
    documentType?: string | null | undefined;
  }): SenceDocument {
    const now = new Date();

    return new SenceDocument({
      id: randomUUID(),
      organizationId: input.organizationId,
      senceDeclarationId: input.senceDeclarationId,
      documentId: input.documentId,
      documentType: input.documentType ?? null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1,
    });
  }

  static rehydrate(props: SenceDocumentProps): SenceDocument {
    return new SenceDocument(props);
  }

  toPrimitives(): SenceDocumentProps {
    return { ...this.props };
  }
}
