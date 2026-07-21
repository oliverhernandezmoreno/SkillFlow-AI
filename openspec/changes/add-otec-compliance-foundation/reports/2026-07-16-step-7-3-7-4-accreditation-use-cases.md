# Steps 7.3–7.4: OTEC Accreditation Use Cases

- Date: 2026-07-16
- Change: `add-otec-compliance-foundation`
- Result: PASS

## Use Cases Delivered

- `CreateOtecAccreditationUseCase`
- `ListOtecAccreditationsUseCase`
- `GetOtecAccreditationUseCase`
- `UpdateOtecAccreditationUseCase`
- `SuspendOtecAccreditationUseCase`
- `RevokeOtecAccreditationUseCase`

No HTTP controller, route, frontend artifact, external integration, migration, event infrastructure, commit, push, tag, or deployment was added.

## TDD Evidence

### RED

The focused suite failed before implementation because all six authorized use-case modules were absent. Vitest reported failure to resolve `create-otec-accreditation.use-case.js`; the same test file imported and specified all six missing contracts.

### GREEN

The focused application suite passes 18/18 behavioral tests. It uses tenant-scoped in-memory repositories and a rollback-capable unit-of-work test double; PostgreSQL integration separately proves the real Prisma transaction boundary.

### REFACTOR

- Shared DTO and mapper avoid persistence leakage.
- Shared helpers centralize authoritative tenant context, non-disclosing lookup, scope-change rejection, and audit context.
- The OTEC unit of work now exposes `OtecProfileRepository` because creation validates the active parent inside the same transaction.
- Only the Prisma profile repository constructor was widened to accept `Prisma.TransactionClient`; existing root-client use remains compatible.
- Transition rules live in `OtecAccreditation`, not application or infrastructure code.

## Rule Coverage

| Area | Covered behavior | Result |
|---|---|---|
| Create | authenticated tenant, active same-tenant profile, missing/foreign profile rejection, date range, initial state, active duplicate, context-owned tenant, audit, no persistence on validation/audit failure | PASS |
| List | tenant isolation, soft-delete exclusion, status/current/expired filters, pagination, stable order, empty tenant | PASS |
| Get | own record, foreign non-disclosure, soft-deleted non-disclosure, missing ID | PASS |
| Update | expected version, version increment, stale conflict, date validation, immutable tenant/profile scope, before/after audit, revoked update prohibition | PASS |
| Suspend | explicit ACTIVE transition, expired/revoked/cancelled/already-suspended rejection, cross-tenant non-disclosure, stale conflict, reason metadata, second-suspension policy | PASS |
| Revoke | ACTIVE/SUSPENDED transition, cancelled/already-revoked rejection, no later generic update/reactivation, cross-tenant non-disclosure, stale conflict, reason metadata | PASS |
| Transactionality | critical repository and audit writes share one unit of work; PostgreSQL audit FK failure rolls back the record | PASS |

Second suspension and second revocation use a consistent rejection policy (`ConflictError`); transitions are not silently idempotent.

## Security and Consistency Results

- **Tenant isolation:** PASS. Tenant identity comes exclusively from `UseCaseContext`; supplied `organizationId` is ignored during create and rejected during reassignment attempts. Foreign IDs return `NotFoundError`.
- **Optimistic concurrency:** PASS. Mutation DTOs require `expectedVersion`; repository updates receive it unchanged and stale writes surface `ConflictError` before success audit.
- **Audit:** PASS. Create, update, suspend, and revoke record audit entries inside the transaction. Update and transitions include before/after evidence. Transition reason is stored only in audit metadata because the approved persistence model has no reason column.
- **Atomicity:** PASS. Application tests prove rollback behavior at the unit-of-work boundary; PostgreSQL tests prove actual Prisma rollback when audit persistence fails.

## Quality Gates

| Gate | Result |
|---|---|
| Accreditation use-case tests | PASS — 18/18 |
| Related PostgreSQL tests | PASS — 36/36 |
| Full backend regression | PASS — 219/219 across 26 files |
| TypeScript build | PASS |
| ESLint | PASS |
| Prisma validation | PASS |

## Files Created

- `src/modules/otec-compliance/application/dto/otec-accreditation.dto.ts`
- `src/modules/otec-compliance/application/mappers/otec-accreditation.mapper.ts`
- `src/modules/otec-compliance/application/use-cases/otec-accreditation-use-case.helpers.ts`
- `src/modules/otec-compliance/application/use-cases/create-otec-accreditation.use-case.ts`
- `src/modules/otec-compliance/application/use-cases/list-otec-accreditations.use-case.ts`
- `src/modules/otec-compliance/application/use-cases/get-otec-accreditation.use-case.ts`
- `src/modules/otec-compliance/application/use-cases/update-otec-accreditation.use-case.ts`
- `src/modules/otec-compliance/application/use-cases/suspend-otec-accreditation.use-case.ts`
- `src/modules/otec-compliance/application/use-cases/revoke-otec-accreditation.use-case.ts`
- `src/modules/otec-compliance/application/use-cases/otec-accreditation.use-cases.test.ts`
- `openspec/changes/add-otec-compliance-foundation/reports/2026-07-16-step-7-3-7-4-accreditation-use-cases.md`

## Files Modified

- `src/modules/otec-compliance/domain/entities/otec-accreditation.entity.ts`
- `src/modules/otec-compliance/application/ports/otec-compliance-unit-of-work.ts`
- `src/modules/otec-compliance/infrastructure/prisma/prisma-otec-compliance-transaction-manager.ts`
- `src/modules/otec-compliance/infrastructure/prisma/prisma-otec-profile.repository.ts`
- `openspec/changes/add-otec-compliance-foundation/tasks.md`

## Risks and Technical Debt

- Suspension/revocation reason and actor are audit evidence only because the approved accreditation table has no dedicated reason/actor columns.
- Expiration remains derived from `validUntil`; no persisted `EXPIRED` lifecycle status was introduced.
- Read-only list/get use the standalone tenant-scoped repository; only critical mutations require the transaction manager.
- OpenSpec 7.11 remains responsible for the complete audit/correlation strategy beyond this accreditation slice.
- Validators and HTTP mappings remain intentionally deferred to tasks 8.1–8.4.

## Decision

**GO for the next authorized backend use-case group.** Accreditation tasks 7.3–7.4 meet tenant isolation, concurrency, audit, transaction, regression, and scope gates. Stop at this checkpoint; do not continue automatically to task 7.5.
