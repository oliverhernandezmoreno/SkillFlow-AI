# Step 7.5 Quality Certification Use Cases Checkpoint

## Scope

This checkpoint implements only the backend application use cases for quality certifications: create, list, get, update, and deactivate. It does not add HTTP controllers, routes, frontend behavior, external integrations, notifications, jobs, electronic signatures, document uploads, office use cases, representative use cases, or later OpenSpec work.

## TDD Evidence

- RED: the new behavioral suite failed because the five QualityCertification use-case modules did not exist.
- GREEN: the minimal use cases, DTOs, mapper, validation helpers, repository filters, entity transitions, and transactional UnitOfWork dependencies were implemented.
- REFACTOR: shared parsing, date validation, DTO mapping, and transaction-aware Prisma adapters removed duplication while keeping Prisma out of application use cases.
- Focused result: 12 QualityCertification use-case tests and 10 readiness tests passed (22/22).

## Behavioral Coverage

### Create

- Creates valid ISO and NCH_2728 certifications.
- Rejects missing or foreign OTEC profiles, invalid date ranges, unsupported certification types, foreign documents, and incompatible duplicates.
- Derives `organizationId` from `UseCaseContext`, records an audit event, and rolls persistence back when audit logging fails.

### List and Get

- Enforces tenant isolation and excludes soft-deleted records by default.
- Supports type, status, current, expired, and expiring-soon filtering.
- Provides deterministic pagination and returns an empty page for tenants without records.
- Does not disclose foreign, deleted, or missing certifications through get operations.

### Update and Deactivate

- Requires `expectedVersion`; the repository includes tenant, record ID, active state, and version in the persistence predicate.
- Increments versions and maps stale writes to conflicts without changing persisted data.
- Prevents tenant and profile reassignment, validates document ownership, and records before/after audit snapshots.
- Deactivation is a versioned soft delete. A second deactivation behaves as not found because inactive records are excluded.
- Audit failures roll back both update and deactivation mutations.

## Transaction and PostgreSQL Evidence

- The in-memory transaction contract verifies rollback for create, update, and deactivate audit failures.
- A PostgreSQL integration test deliberately causes the transactional AuditLogger insert to fail through referential integrity and verifies that the QualityCertification insert count remains zero.
- Related PostgreSQL suites passed: 35/35 tests across regulatory repositories, reference adapters, and the transaction manager.
- Post-test fixture check: `quality_certification=0` and `audit_event=0` for the test tenant IDs.

## Readiness Evidence

- An active, current NCH_2728 certification satisfies the configured requirement.
- Missing or expired NCH_2728 evidence blocks readiness when required.
- Soft-deleted and foreign-tenant certifications do not count because the repository snapshot is tenant-scoped and excludes deleted rows.
- Absence does not block readiness when NCH_2728 is optional.
- Expiring-soon evidence emits a warning without necessarily blocking readiness.
- This is internal configured-date evaluation only; it does not claim official NCh2728 validation.

## Files Added

- `src/modules/otec-compliance/application/dto/quality-certification.dto.ts`
- `src/modules/otec-compliance/application/mappers/quality-certification.mapper.ts`
- `src/modules/otec-compliance/application/use-cases/quality-certification-use-case.helpers.ts`
- `src/modules/otec-compliance/application/use-cases/create-quality-certification.use-case.ts`
- `src/modules/otec-compliance/application/use-cases/list-quality-certifications.use-case.ts`
- `src/modules/otec-compliance/application/use-cases/get-quality-certification.use-case.ts`
- `src/modules/otec-compliance/application/use-cases/update-quality-certification.use-case.ts`
- `src/modules/otec-compliance/application/use-cases/deactivate-quality-certification.use-case.ts`
- `src/modules/otec-compliance/application/use-cases/quality-certification.use-cases.test.ts`

## Files Modified

- `src/modules/otec-compliance/domain/entities/quality-certification.ts`
- `src/modules/otec-compliance/domain/repositories/quality-certification.repository.ts`
- `src/modules/otec-compliance/application/ports/otec-compliance-unit-of-work.ts`
- `src/modules/otec-compliance/infrastructure/prisma/prisma-quality-certification.repository.ts`
- `src/modules/otec-compliance/infrastructure/prisma/prisma-tenant-document-ownership.adapter.ts`
- `src/modules/otec-compliance/infrastructure/prisma/prisma-otec-compliance-transaction-manager.ts`
- `src/modules/otec-compliance/infrastructure/prisma/prisma-otec-compliance-transaction-manager.integration.test.ts`
- `src/modules/otec-compliance/application/use-cases/otec-accreditation.use-cases.test.ts`
- `openspec/changes/add-otec-compliance-foundation/tasks.md`

## Quality Gates

| Gate | Result |
| --- | --- |
| QualityCertification and readiness tests | PASS, 22/22 |
| Related PostgreSQL integration tests | PASS, 35/35 |
| Complete backend regression | PASS, 232/232 across 27 files |
| TypeScript build | PASS |
| ESLint | PASS |
| Prisma validation | PASS |
| OpenSpec strict validation | PASS |
| PostgreSQL fixture cleanup | PASS, zero residual certification and audit fixtures |

The first sandboxed full-regression attempt could not reach the local PostgreSQL service. The same command passed completely when rerun with approved local service access; this was an execution-environment access issue rather than a test assertion failure.

## Risks and Technical Debt

- The original combined tasks 7.5 and 7.6 remain open because office and legal representative use cases are deliberately outside this authorization.
- Readiness consumes a pre-authorized, tenant-scoped snapshot. Future composition must preserve that boundary when application orchestration is added.
- No HTTP contract exists yet for these use cases, by explicit scope restriction.
- Certification-type support remains restricted to the existing domain enum and internal configuration; no external or official validation is performed.

## Decision

**GO for OpenSpec 7.6 only if separately authorized.** QualityCertification use cases satisfy the approved transactional, tenant-isolation, concurrency, audit rollback, and readiness requirements. No OpenSpec 7.6 work was started by this checkpoint.
