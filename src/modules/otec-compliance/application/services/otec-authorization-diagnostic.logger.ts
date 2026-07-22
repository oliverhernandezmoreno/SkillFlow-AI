import pino from 'pino';

import type { UseCaseContext } from '../../../../shared/application/use-case-context.js';
import type { OtecCompliancePermission } from './otec-compliance-authorization.policy.js';

export const otecAuthorizationDiagnosticLogger = pino({
  name: 'otec-authorization-diagnostic',
});

export function logOtecAuthorizationDenial(input: {
  source: string;
  operation: string;
  requiredPermission: OtecCompliancePermission;
  context: UseCaseContext;
}): void {
  const actorPermissions = input.context.permissions ?? [];
  const permissionPresent = actorPermissions.includes(input.requiredPermission);

  otecAuthorizationDiagnosticLogger.warn(
    {
      marker: 'OTEC_AUTHORIZATION_DIAGNOSTIC',
      source: input.source,
      operation: input.operation,
      requiredPermission: input.requiredPermission,
      actorUserId: input.context.actorUserId,
      organizationId: input.context.organizationId,
      actorRoleIds: null,
      actorPermissions: actorPermissions.filter((permission) =>
        permission.startsWith('otec_compliance.'),
      ),
      permissionPresent,
      rejectionCondition: {
        permissionMissing: !permissionPresent,
      },
      tenantComparison: {
        authenticatedOrganizationId: input.context.organizationId,
        resourceOrganizationId: null,
        matches: null,
      },
    },
    'OTEC_AUTHORIZATION_DIAGNOSTIC permission denied',
  );
}
