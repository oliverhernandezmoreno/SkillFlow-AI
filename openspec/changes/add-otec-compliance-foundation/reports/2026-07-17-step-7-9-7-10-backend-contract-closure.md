# OpenSpec 7.9–7.10 Backend Contract Closure

**Date:** 2026-07-17  
**Branch:** `feature/add-otec-compliance-foundation-backend`  
**Decision:** 7.9–7.10 complete; HTTP remains NO-GO

## Scope and Decisions

The canonical parent tasks are 7.9 and 7.10. Subtasks 7.9.1–7.10.3 were existing readiness evidence. This closure added and completed 7.9.3–7.10.7 without renumbering historical tasks. The initial evidence-based matrix is in `2026-07-17-step-7-9-7-10-initial-task-decision-matrix.md`.

Implemented capabilities are compliance summary, deterministic paginated expiration listing, and internal activity-preparation validation. Standalone findings and blocking-item queries are `SUPERSEDED_BY EvaluateOtecReadiness`. Readiness history persistence is `EXCLUDED_BY_DESIGN` because historical evaluation uses `evaluationDate` and no migration is approved. Resolution queries are `NOT_APPLICABLE` to this slice. RBAC enforcement is `DEFERRED_TO_HTTP` 8.5–8.6. Query audit writes are `EXCLUDED_BY_DESIGN`.

## TDD Evidence

RED first reported missing classifier and three missing use-case modules. GREEN added `effective-date-policy.ts`, `otec-expiration-classifier.ts`, and the three query use cases. REFACTOR extracted inclusive UTC calendar-day behavior shared by expiration and readiness and retained a single readiness rule engine. Final focused result: 23/23 new query/classifier tests plus 43/43 readiness tests.

PostgreSQL query evidence covers a consolidated summary/activity result, tenant-safe and soft-delete-safe expiration projection, exceptional-state ordering, pagination, and foreign-profile non-disclosure. The targeted database result was 12/12 tests, including the snapshot and transaction manager suites. Full repository regression includes 31 regulatory repository integration tests.

## Quality Gates

| Gate | Command | Exit | Result | Duration/correction |
|---|---|---:|---|---|
| Initial focused invocation | `npm test -- --runInBand ...` | 1 | Vitest rejected unsupported option; no test executed | Corrected immediately; no suppression |
| New focused tests | `npm test -- <classifier> <query-use-cases> ...` | 0 | 2 files, 23/23 passed | 614 ms; unmatched filename corrected separately |
| Readiness regression | `npm test -- <integral> <evaluator> <evaluate-use-case>` | 0 | 3 files, 43/43 passed | 584 ms |
| PostgreSQL queries/transactions | `npm test -- <query-integration> <snapshot-integration> <transaction-integration>` | 0 | 3 files, 12/12 passed | 1.24 s |
| Full backend regression | `npm test` | 0 | 37 files, 350/350 passed, 0 failed/skipped/retried | 8.18 s |
| TypeScript build | `npm run build` | 0 | Passed | No correction |
| Lint | `npm run lint` | 0 | Passed | One earlier `no-confusing-void-expression` issue was corrected before final gate |
| Prisma | `npx prisma validate` | 0 | Schema valid | No migration added or changed in this slice |
| OpenSpec | `npx openspec validate add-otec-compliance-foundation --strict` | 0 | Change valid | No correction |
| Diff whitespace | `git diff --check` | 0 | Passed | No correction |
| Database restoration | `psql` counts over eight OTEC tables | 0 | Every count is zero | First attempts used a nonexistent database and one wrong physical table name; corrected to configured database/mappings |

No force-exit, hidden failure, disabled test, or open-handle suppression was used.

## Files for This Closure

Created:

- `src/modules/otec-compliance/domain/services/effective-date-policy.ts`
- `src/modules/otec-compliance/domain/services/otec-expiration-classifier.ts`
- `src/modules/otec-compliance/domain/services/otec-expiration-classifier.test.ts`
- `src/modules/otec-compliance/application/use-cases/get-otec-compliance-summary.use-case.ts`
- `src/modules/otec-compliance/application/use-cases/get-expiring-compliance-items.use-case.ts`
- `src/modules/otec-compliance/application/use-cases/validate-otec-can-prepare-sence-activity.use-case.ts`
- `src/modules/otec-compliance/application/use-cases/otec-compliance-query.use-cases.test.ts`
- `src/modules/otec-compliance/infrastructure/prisma/prisma-otec-compliance-query.integration.test.ts`
- `docs/sence/OTEC_APPLICATION_USE_CASES.md`
- `openspec/changes/add-otec-compliance-foundation/reports/2026-07-17-step-7-9-7-10-initial-task-decision-matrix.md`
- this report

Modified:

- `src/modules/otec-compliance/domain/services/otec-readiness-evaluator.ts`
- `src/modules/otec-compliance/domain/services/otec-readiness-integral.test.ts`
- `openspec/changes/add-otec-compliance-foundation/specs/otec-readiness/spec.md`
- `openspec/changes/add-otec-compliance-foundation/tasks.md`
- `docs/sence/SENCE_REGULATORY_RULES.md`
- `docs/sence/OTEC_READINESS_EVALUATION.md`
- `docs/sence/OTEC_COMPLIANCE_ARCHITECTURE.md`
- `docs/sence/SENCE_TRACEABILITY_MATRIX.md`
- the previous readiness consolidation report for corrected date semantics

## Risks, Debt, and Decision

The snapshot currently loads complete non-deleted profile histories before classification; measurement may justify projection optimization later. Regulatory choices remain configuration with functional-validation status and are not represented as official validation.

HTTP is **NO-GO**. Profile mutations do not yet share one unit of work with audit, so audit failure can leave persistence committed. Entitlement enforcement is also inconsistent in profile, accreditation, and quality-certification application slices. RBAC enforcement remains intentionally deferred to delivery tasks 8.5–8.6. The first two gaps require separately authorized backend remediation before stable HTTP contracts can be exposed.

No controller, route, HTTP DTO, endpoint OpenAPI, frontend, migration, external integration, commit, push, tag, or deployment was added or performed.
