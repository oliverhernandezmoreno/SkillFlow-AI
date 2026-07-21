# Steps 7.7–7.8 OTEC Resolution Use Cases Checkpoint

## Scope

This checkpoint implements only the backend application and domain behavior for OTEC resolutions: create, list, get, update, supersede, and deactivate. It does not add HTTP controllers, routes, frontend behavior, external integrations, notifications, jobs, document upload, electronic signatures, or later OpenSpec work.

The implementation treats resolution records as internal administrative evidence. It does not claim official validation, synchronization, or recognition by SENCE or any other external authority.

## TDD Evidence

- RED: the new application and domain suites failed because the six use cases and chain resolver did not exist.
- GREEN: the minimum aggregate transitions, resolver, DTOs, mapper, helpers, transactional repository behavior, and use cases were implemented.
- REFACTOR: chain traversal was isolated in `ResolutionChainResolver`; common access, tenant, document, parsing, and scope rules were centralized; Prisma remains outside application use cases.
- Focused result: 15 application tests, 6 chain-resolution tests, and 10 readiness tests passed (31/31).

## Implemented Use Cases

- `CreateOtecResolutionUseCase`
- `ListOtecResolutionsUseCase`
- `GetOtecResolutionUseCase`
- `UpdateOtecResolutionUseCase`
- `SupersedeOtecResolutionUseCase`
- `DeactivateOtecResolutionUseCase`

Every mutation runs through `OtecComplianceTransactionManager`. Persistence and `AuditLogger` share the same UnitOfWork transaction, and audit failure rolls back the business mutation.

## Behavioral Coverage

### Create, List, Get, Update, and Deactivate

- Tenant identity is derived from `UseCaseContext`; payloads cannot reassign organization or profile scope.
- Entitlement, active same-tenant profile, document ownership, supported type, and date range are validated.
- List supports tenant-safe deterministic pagination and approved profile, type, status, effective-date, future, and expired filters; soft-deleted rows are excluded.
- Get does not disclose missing, foreign, or soft-deleted records.
- Update and deactivate require `expectedVersion`; stale versions map to conflict and the persistence predicate includes tenant, ID, active state, and version.
- Deactivation is a soft delete. A repeated deactivation behaves as not found, and a historical `SUPERSEDED` record cannot be deactivated.
- Create, update, supersede, and deactivate audits include actor context, before/after data where applicable, an internal-record marker, and `correlationId` metadata when supplied.

### Supersession and History

- `supersedesResolutionId` is the single persisted predecessor pointer from the replacement to the replaced resolution; the inverse relation is derived.
- A valid supersession atomically marks the replaced resolution `SUPERSEDED`, links the active replacement, and increments both versions.
- Both replacement and replaced expected versions are mandatory and participate in persistence predicates.
- Self-supersession, foreign tenant, different profile, inactive, deleted, already-superseded, direct cycle, indirect cycle, and deep cycle attempts are rejected.
- A deterministic five-level chain is reconstructed from oldest to terminal resolution.
- Concurrent attempts to replace the same resolution produce exactly one winner and one conflict; only one replacement link remains persisted.
- Traversal uses a visited set and a defensive maximum depth of 100.

## Transaction and PostgreSQL Evidence

- In-memory transaction tests verify rollback when audit logging fails for resolution mutations.
- PostgreSQL integration deliberately triggers an AuditLogger foreign-key failure and verifies rollback of resolution creation.
- A second PostgreSQL test verifies rollback of both sides of a supersession: the replaced resolution remains `ACTIVE` at version 1 and the replacement remains unlinked at version 1.
- Repository integration verifies optimistic concurrency, referential integrity, tenant isolation, cross-tenant rejection, soft delete, partial unique indexes, status/effective filters, pagination, valid supersession, cycle prevention, and the concurrent supersession race.
- Related repository and transaction-manager suites passed 38/38 tests.

## Readiness Evidence

- OTEC-RES-001 accepts current active terminal evidence of each configured required resolution type.
- Missing, inactive, future, expired, superseded, soft-deleted, and foreign-tenant evidence does not satisfy readiness.
- Superseding a qualifying resolution transfers qualifying history only when the terminal replacement independently satisfies the configured type and date rule.
- Deactivating the only qualifying terminal record causes a blocking readiness result.
- Readiness consumes a tenant-scoped repository snapshot; it performs internal configured-date evaluation only.

## Files Added

- `src/modules/otec-compliance/domain/services/resolution-chain-resolver.ts`
- `src/modules/otec-compliance/domain/services/resolution-chain-resolver.test.ts`
- `src/modules/otec-compliance/application/dto/otec-resolution.dto.ts`
- `src/modules/otec-compliance/application/mappers/otec-resolution.mapper.ts`
- `src/modules/otec-compliance/application/use-cases/otec-resolution-use-case.helpers.ts`
- `src/modules/otec-compliance/application/use-cases/create-otec-resolution.use-case.ts`
- `src/modules/otec-compliance/application/use-cases/list-otec-resolutions.use-case.ts`
- `src/modules/otec-compliance/application/use-cases/get-otec-resolution.use-case.ts`
- `src/modules/otec-compliance/application/use-cases/update-otec-resolution.use-case.ts`
- `src/modules/otec-compliance/application/use-cases/supersede-otec-resolution.use-case.ts`
- `src/modules/otec-compliance/application/use-cases/deactivate-otec-resolution.use-case.ts`
- `src/modules/otec-compliance/application/use-cases/otec-resolution.use-cases.test.ts`

## Files Modified

- `src/shared/application/use-case-context.ts`
- `src/modules/otec-compliance/domain/entities/otec-resolution.entity.ts`
- `src/modules/otec-compliance/domain/repositories/otec-regulatory-record.repositories.ts`
- `src/modules/otec-compliance/application/ports/otec-compliance-unit-of-work.ts`
- `src/modules/otec-compliance/infrastructure/prisma/prisma-otec-resolution.repository.ts`
- `src/modules/otec-compliance/infrastructure/prisma/prisma-otec-compliance-transaction-manager.ts`
- `src/modules/otec-compliance/infrastructure/prisma/prisma-otec-regulatory-record.repositories.integration.test.ts`
- `src/modules/otec-compliance/infrastructure/prisma/prisma-otec-compliance-transaction-manager.integration.test.ts`
- Existing accreditation, certification, office, and representative test UnitOfWork fakes
- `openspec/changes/add-otec-compliance-foundation/tasks.md`

## Quality Gates

| Gate | Result |
| --- | --- |
| Resolution application, chain, and readiness tests | PASS, 31/31 |
| Related PostgreSQL repository and transaction tests | PASS, 38/38 |
| Complete backend regression | PASS, 289/289 across 31 files |
| TypeScript build | PASS |
| ESLint | PASS |
| Prisma validation | PASS |
| OpenSpec strict validation | PASS |
| Diff whitespace validation | PASS |

The first sandboxed regression could not reach PostgreSQL on `localhost:5433`. The identical command passed outside the restricted sandbox; this was an execution-environment access failure, not a failed assertion.

## Risks and Technical Debt

- Historical lineage is intentionally represented by one predecessor pointer. Consumers must derive the inverse relation instead of persisting a second source of truth.
- Readiness composition must continue to supply a tenant-scoped, soft-delete-filtered snapshot and identify superseded evidence consistently.
- The 100-link traversal limit is defensive; a future business limit may be lower once a regulatory requirement exists.
- Correlation identifiers are stored in structured audit metadata rather than a dedicated database column. Broader audit normalization remains outside this slice.
- Required resolution types remain internally configurable and must not be presented as official external validation.
- HTTP contracts and authorization middleware wiring remain deliberately unimplemented.

## Decision

**GO for the next backend consolidation or use-case slice only if separately authorized. NO-GO for HTTP controllers and frontend.** Steps 7.7–7.8 satisfy the approved tenant isolation, transactional audit, rollback, concurrency, supersession, cycle-prevention, history, filtering, and readiness requirements. No later OpenSpec work was started.
