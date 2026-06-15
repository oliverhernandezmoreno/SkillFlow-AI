import {
  anonymousUseCaseContext,
  type UseCaseContext,
} from '../../../../shared/application/use-case-context.js';
import { NotFoundError, UnauthorizedError } from '../../../../shared/domain/errors.js';
import type { SenceDeclaration } from '../../domain/entities/sence-declaration.entity.js';
import type { SenceComplianceSnapshot, SenceRepository } from '../../domain/repositories/sence.repository.js';

export function requireOrganizationId(context: UseCaseContext = anonymousUseCaseContext): string {
  if (!context.organizationId) {
    throw new UnauthorizedError('Authentication required');
  }
  return context.organizationId;
}

export async function loadSenceDeclaration(input: {
  repository: SenceRepository;
  declarationId: string;
  organizationId: string;
}): Promise<SenceDeclaration> {
  const declaration = await input.repository.findById(input.declarationId, input.organizationId);
  if (!declaration) {
    throw new NotFoundError('SENCE declaration not found');
  }
  return declaration;
}

export async function loadSenceSnapshot(input: {
  repository: SenceRepository;
  declarationId: string;
  organizationId: string;
}): Promise<SenceComplianceSnapshot> {
  const snapshot = await input.repository.getComplianceSnapshot(input.organizationId, input.declarationId);
  if (!snapshot) {
    throw new NotFoundError('SENCE declaration not found');
  }
  return snapshot;
}
