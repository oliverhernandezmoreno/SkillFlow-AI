# Step 7.6 OTEC Office Use Cases Checkpoint

## Scope

This checkpoint implements only the backend application use cases for OTEC offices: create, list, get, update, and deactivate. It does not add HTTP controllers, routes, HTTP DTOs, frontend behavior, external integrations, notifications, jobs, physical document uploads, or migrations.

## TDD Evidence

- RED: the new OtecOffice behavioral suite failed because the five use-case modules did not exist.
- GREEN: the five use cases, application DTO, mapper, validation/access helpers, entity transitions, approved repository filters, and transaction UnitOfWork dependency were implemented. The focused suite passed 17/17 tests.
- REFACTOR: a shared access guard, explicit injected time provider, DTO mapper, domain transition methods, and repository filter composition keep Prisma and ambient time out of application decisions.

## Implemented Behavior

### CreateOtecOffice

- Checks OTEC Compliance office feature access before execution.
- Derives `organizationId` exclusively from `UseCaseContext`.
- Requires an active same-tenant OTEC profile.
- Supports the existing HEADQUARTERS, BRANCH, OPERATING_OFFICE, TRAINING_SITE, and OTHER types.
- Normalizes required text and uppercases the office code and country.
- Rejects invalid date ranges, missing required values, unsupported types, and active duplicate codes.
- Persists and audits within one UnitOfWork transaction.

### ListOtecOffices and GetOtecOffice

- Use the approved transaction manager for repository access.
- Enforce tenant isolation and exclude soft-deleted rows.
- Support status, type, effective-date, expired, and expiring-window filters already approved by OpenSpec contracts.
- Provide deterministic ordering and pagination.
- Ignore arbitrary consumer organization fields by deriving scope from context.
- Return the established non-disclosure not-found behavior for foreign, deleted, and missing records.

### UpdateOtecOffice and DeactivateOtecOffice

- Require `expectedVersion`; Prisma includes tenant, record ID, active state, and version in the update predicate.
- Increment the entity version and reject stale writes as conflicts.
- Prevent ordinary organization and OTEC profile reassignment.
- Validate the resulting date range without modifying persisted state on failure.
- Record safe before/after audit evidence in the persistence transaction.
- Deactivation is an explicit versioned soft delete, retains the record, and returns not found on a second attempt because deleted records are excluded.
- An optional deactivation reason is stored only in safe audit metadata because the current data model has no dedicated reason column.

## Tenant, Atomicity, and PostgreSQL Evidence

- Tests prove that Tenant A cannot create against, get, update, deactivate, or list Tenant B office data.
- Audit events use the authenticated tenant identifier.
- In-memory transaction tests prove create, update, and deactivate rollback on audit failure.
- A PostgreSQL test deliberately violates the AuditEvent actor foreign key after inserting an office in the same Prisma transaction and verifies the office count remains zero.
- Related PostgreSQL suites passed 34/34 tests, covering repository tenant predicates, soft delete, active partial uniqueness, filters, pagination, referential integrity, cross-tenant relationships, expected-version predicates, conflicts, and transactional rollback.
- Post-test fixture verification returned `otec_office=0` and `audit_event=0` for the transaction test tenant.

## OTEC-OFF-001 Readiness Evidence

- A current active office of a configured qualifying type satisfies the rule.
- Inactive, soft-deleted, future, expired, foreign-tenant, and non-qualifying offices do not satisfy it.
- A historically effective office satisfies an explicitly dated historical evaluation.
- Multiple valid offices do not change a passing result negatively.
- Removing or deactivating the only valid office changes readiness to NOT_READY.
- Invalid offices do not substitute for a valid qualifying office.
- Evaluation remains internal and does not claim official SENCE authorization.

## Files Added

- `src/modules/otec-compliance/application/dto/otec-office.dto.ts`
- `src/modules/otec-compliance/application/mappers/otec-office.mapper.ts`
- `src/modules/otec-compliance/application/use-cases/otec-office-use-case.helpers.ts`
- `src/modules/otec-compliance/application/use-cases/create-otec-office.use-case.ts`
- `src/modules/otec-compliance/application/use-cases/list-otec-offices.use-case.ts`
- `src/modules/otec-compliance/application/use-cases/get-otec-office.use-case.ts`
- `src/modules/otec-compliance/application/use-cases/update-otec-office.use-case.ts`
- `src/modules/otec-compliance/application/use-cases/deactivate-otec-office.use-case.ts`
- `src/modules/otec-compliance/application/use-cases/otec-office.use-cases.test.ts`

## Files Modified

- `src/modules/otec-compliance/domain/entities/otec-office.entity.ts`
- `src/modules/otec-compliance/domain/repositories/otec-regulatory-record.repositories.ts`
- `src/modules/otec-compliance/application/ports/otec-compliance-unit-of-work.ts`
- `src/modules/otec-compliance/infrastructure/prisma/prisma-otec-regulatory-record.repositories.ts`
- `src/modules/otec-compliance/infrastructure/prisma/prisma-otec-compliance-transaction-manager.ts`
- `src/modules/otec-compliance/infrastructure/prisma/prisma-otec-compliance-transaction-manager.integration.test.ts`
- `src/modules/otec-compliance/application/use-cases/otec-accreditation.use-cases.test.ts`
- `src/modules/otec-compliance/application/use-cases/quality-certification.use-cases.test.ts`
- `openspec/changes/add-otec-compliance-foundation/tasks.md`

## Quality Gates

| Gate | Result |
| --- | --- |
| OtecOffice use-case tests | PASS, 17/17 |
| OtecOffice plus readiness focused tests | PASS, 27/27 |
| Related PostgreSQL integration tests | PASS, 34/34 |
| Complete backend regression | PASS, 250/250 across 28 files |
| TypeScript build | PASS |
| ESLint | PASS |
| Prisma validation | PASS |
| OpenSpec strict validation | PASS |
| PostgreSQL fixture cleanup | PASS, zero residual office and audit fixtures |

## Risks and Technical Debt

- The original combined tasks 7.5 and 7.6 remain open because LegalRepresentative use cases are deliberately outside this authorization.
- The current schema does not persist a dedicated deactivation reason. The reason is retained in audit metadata only.
- Readiness consumes a pre-authorized tenant-scoped snapshot; later orchestration must preserve this boundary.
- Entitlement evaluation precedes the UnitOfWork transaction. This is an authorization precondition; persistence and audit remain atomic inside the transaction.
- No general shared Clock existed, so this slice uses a narrow injected `TimeProvider` without introducing a second time framework.

## Decision

**GO to request separate authorization for OpenSpec 7.7.** The authorized OtecOffice slice meets tenant isolation, entitlement, concurrency, transaction, audit rollback, soft deletion, effective-date, and readiness requirements. No 7.7 work was started.
