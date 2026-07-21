import { Entity } from '../../../../domain/shared/entity.js';

export type ModuleCode = 'OTEC_COMPLIANCE';
export type ModuleEntitlementStatus =
  | 'ENABLED'
  | 'DISABLED'
  | 'SUSPENDED'
  | 'EXPIRED'
  | 'PLAN_RESTRICTED';

export type ModuleAccessDenialReason =
  | 'DISABLED'
  | 'SUSPENDED'
  | 'EXPIRED'
  | 'PLAN_RESTRICTED'
  | 'NOT_EFFECTIVE'
  | 'FEATURE_DISABLED'
  | 'UNAVAILABLE';

export type ModuleAccessDecision =
  | { allowed: true; reason: 'ENABLED' }
  | { allowed: false; reason: ModuleAccessDenialReason };

export interface ModuleEntitlementProps {
  id: string;
  organizationId: string;
  moduleCode: ModuleCode;
  status: ModuleEntitlementStatus;
  enabledFeatures: string[];
  validFrom: Date | null;
  validUntil: Date | null;
  restrictionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  version: number;
}

export class ModuleEntitlement extends Entity<string> {
  private constructor(private readonly props: ModuleEntitlementProps) {
    super(props.id);
  }

  static rehydrate(props: ModuleEntitlementProps): ModuleEntitlement {
    return new ModuleEntitlement({ ...props, enabledFeatures: [...props.enabledFeatures] });
  }

  evaluateAccess(input: { organizationId: string; evaluatedAt: Date }): ModuleAccessDecision {
    if (this.props.organizationId !== input.organizationId || this.props.deletedAt) {
      return { allowed: false, reason: 'UNAVAILABLE' };
    }
    if (this.props.status !== 'ENABLED') {
      return { allowed: false, reason: this.props.status };
    }
    if (this.props.validFrom && input.evaluatedAt < this.props.validFrom) {
      return { allowed: false, reason: 'NOT_EFFECTIVE' };
    }
    if (this.props.validUntil && input.evaluatedAt > this.props.validUntil) {
      return { allowed: false, reason: 'EXPIRED' };
    }
    return { allowed: true, reason: 'ENABLED' };
  }

  toPrimitives(): ModuleEntitlementProps {
    return { ...this.props, enabledFeatures: [...this.props.enabledFeatures] };
  }
}
