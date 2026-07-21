# User-Authorized Step 7.7 Legal Representative Use Cases Checkpoint

## Numbering Note and Scope

The user authorization labels this slice OpenSpec 7.7. The canonical task plan places LegalRepresentative work in the combined 7.5–7.6 certification/office/representative tasks and reserves canonical task 7.7 for resolution RED tests. This checkpoint completes the LegalRepresentative portion and closes canonical tasks 7.5–7.6 without starting resolution work.

Implemented use cases: CreateLegalRepresentative, ListLegalRepresentatives, GetLegalRepresentative, UpdateLegalRepresentative, and DeactivateLegalRepresentative. No HTTP controllers, routes, HTTP DTOs, frontend behavior, external integrations, notifications, jobs, electronic signatures, physical document uploads, or migrations were added.

## TDD Evidence

- RED: the new behavioral suite failed because the five use-case modules did not exist.
- GREEN: the entity transitions, DTO, application and safe-audit mappers, validation/access helpers, transaction UnitOfWork dependency, and five use cases were implemented. The focused suite passed 14/14 tests.
- REFACTOR: shared entitlement, document ownership, scope protection, error mapping, injected time, and PII-safe audit mapping remove duplication while keeping Prisma outside application code.

## Rules and Behavioral Coverage

- Uses the authenticated context tenant and checks the approved module entitlement feature.
- Requires an active same-tenant OTEC profile.
- Reuses the existing Rut, Email, and DateRange value objects.
- Validates optional appointment-document ownership through the existing tenant port.
- Does not add phone validation because the repository has no approved Phone value object or utility.
- Supports status, explicit effective-date, expired, deterministic pagination, and empty-list behavior.
- Hides foreign, deleted, and missing records through the established not-found policy.
- Requires expectedVersion, increments versions, prevents tenant/profile reassignment, and maps stale writes to conflict.
- Deactivation is an explicit versioned soft delete. A second attempt returns not found because deleted records are excluded.
- Syntactic RUT validation is explicitly not represented as official identity or representation validation.

## Multiplicity and Uniqueness Decision

The current Prisma schema and migration define no partial or normal uniqueness constraint for LegalRepresentative tax IDs. Existing PostgreSQL repository contracts also declare no representative partial unique index. Therefore this slice permits multiple active representatives, including the same syntactically valid RUT, and does not invent a duplicate rejection or unauthorized migration. Whether active same-RUT duplicates should be prohibited remains a functional policy decision.

## PII and Audit Evidence

- Application results retain the fields already present in the approved model.
- Audit before/after snapshots omit names, notes, appointment document identifiers, and raw personal contact values.
- RUT and phone values are masked; email is replaced with `[REDACTED]`.
- Audit metadata contains only internal-record and syntactic-validation flags plus an optional deactivation reason.
- Tests assert that complete RUT, email, and phone values are absent from serialized audit events.
- Prisma supplies the audit timestamp. Correlation ID remains deferred to canonical task 7.11 because the current UseCaseContext and AuditLogInput contain no approved correlation field.

## Atomicity, Tenant, and PostgreSQL Evidence

- In-memory transactional tests prove rollback for create, update, and deactivate when AuditLogger fails.
- A PostgreSQL test inserts a representative and then deliberately violates the AuditEvent actor foreign key in the same Prisma transaction; the representative count remains zero.
- Tenant A cannot create against, list, get, update, or deactivate Tenant B data, and foreign appointment documents are rejected.
- Related PostgreSQL suites passed 37/37 tests across regulatory repositories, reference ownership adapters, and the transaction manager.
- Repository coverage proves tenant-scoped predicates, soft deletion, effective filters, pagination, referential integrity, cross-tenant rejection, and expected-version conflicts.
- Post-test verification returned `legal_representative=0` and `audit_event=0` for the transaction test tenant.

## OTEC-REP-001 Readiness Evidence

- A current active representative satisfies the rule.
- Inactive, soft-deleted, future, expired, and foreign-tenant representatives do not count.
- An explicitly dated historical evaluation counts a representative effective on that date.
- Multiple valid representatives do not negatively affect readiness.
- Removing or deactivating the only valid representative changes readiness to NOT_READY.
- Invalid records do not substitute for valid evidence.

## Files Added

- `src/modules/otec-compliance/application/dto/legal-representative.dto.ts`
- `src/modules/otec-compliance/application/mappers/legal-representative.mapper.ts`
- `src/modules/otec-compliance/application/use-cases/legal-representative-use-case.helpers.ts`
- `src/modules/otec-compliance/application/use-cases/create-legal-representative.use-case.ts`
- `src/modules/otec-compliance/application/use-cases/list-legal-representatives.use-case.ts`
- `src/modules/otec-compliance/application/use-cases/get-legal-representative.use-case.ts`
- `src/modules/otec-compliance/application/use-cases/update-legal-representative.use-case.ts`
- `src/modules/otec-compliance/application/use-cases/deactivate-legal-representative.use-case.ts`
- `src/modules/otec-compliance/application/use-cases/legal-representative.use-cases.test.ts`

## Files Modified

- `src/modules/otec-compliance/domain/entities/legal-representative.entity.ts`
- `src/modules/otec-compliance/domain/repositories/otec-regulatory-record.repositories.ts`
- `src/modules/otec-compliance/application/ports/otec-compliance-unit-of-work.ts`
- `src/modules/otec-compliance/infrastructure/prisma/prisma-otec-regulatory-record.repositories.ts`
- `src/modules/otec-compliance/infrastructure/prisma/prisma-otec-compliance-transaction-manager.ts`
- `src/modules/otec-compliance/infrastructure/prisma/prisma-otec-compliance-transaction-manager.integration.test.ts`
- `src/modules/otec-compliance/application/use-cases/otec-accreditation.use-cases.test.ts`
- `src/modules/otec-compliance/application/use-cases/quality-certification.use-cases.test.ts`
- `src/modules/otec-compliance/application/use-cases/otec-office.use-cases.test.ts`
- `openspec/changes/add-otec-compliance-foundation/tasks.md`

## Quality Gates

| Gate | Result |
| --- | --- |
| LegalRepresentative use-case tests | PASS, 14/14 |
| LegalRepresentative plus readiness focused tests | PASS, 24/24 |
| Related PostgreSQL integration tests | PASS, 37/37 |
| Complete backend regression | PASS, 265/265 across 29 files |
| TypeScript build | PASS |
| ESLint | PASS |
| Prisma validation | PASS |
| OpenSpec strict validation | PASS |
| PostgreSQL fixture cleanup | PASS, zero residual representative and audit fixtures |

## Risks and Technical Debt

- Active representative RUT uniqueness and representative multiplicity require an explicit functional decision before any constraint is introduced.
- No approved Phone value object exists; phone remains an optional stored string and is masked in audit evidence.
- Correlation identifiers remain deferred to canonical task 7.11.
- The current schema has no dedicated deactivation-reason column; the optional reason is stored in minimized audit metadata.
- Readiness composition must continue supplying a tenant-scoped, soft-delete-aware snapshot.

## Decision

**GO to request separate authorization for canonical OpenSpec 7.7 resolution tests (called 7.8 by the user authorization sequence).** The LegalRepresentative slice meets tenant isolation, PII minimization, concurrency, transaction, rollback, document ownership, soft deletion, effective-date, and readiness requirements. No resolution work was started.
