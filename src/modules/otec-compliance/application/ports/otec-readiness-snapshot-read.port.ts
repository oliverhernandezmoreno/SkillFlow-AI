import type { OtecReadinessSnapshot } from '../../domain/services/otec-readiness-evaluator.js';

export interface OtecReadinessSnapshotReadPort {
  load(input: {
    organizationId: string;
    otecProfileId: string;
    evaluatedAt: Date;
  }): Promise<OtecReadinessSnapshot | null>;
}
