export interface UseCaseContext {
  actorUserId: string | null;
  organizationId: string | null;
  permissions?: readonly string[];
  correlationId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export const anonymousUseCaseContext: UseCaseContext = {
  actorUserId: null,
  organizationId: null,
  permissions: [],
};
