# Step 6: Repository PostgreSQL Integration

## Scope

Completed PostgreSQL integration coverage for the six OTEC regulatory repositories and the organization/document reference ports. No HTTP, frontend, external regulatory integration, commit, push, tag, or deployment work was performed.

## Repository Results

| Repository | PostgreSQL coverage | Result |
|---|---|---|
| OtecProfileRepository | tenant isolation, soft deletion, active partial uniqueness/reuse, status pagination, atomic expected-version conflict | PASS |
| OtecAccreditationRepository | tenant isolation, missing/cross-tenant profile FK rejection, soft deletion, active-number partial uniqueness/reuse, status/effective-date filters, pagination, tenant-scoped expected-version predicate and atomic conflict | PASS |
| QualityCertificationRepository | tenant isolation, missing/cross-tenant profile FK rejection, soft deletion, active-number partial uniqueness/reuse, status/effective-date filters, pagination, tenant-scoped expected-version predicate and atomic conflict | PASS |
| OtecOfficeRepository | tenant isolation, missing/cross-tenant profile FK rejection, soft deletion, active-code partial uniqueness/reuse, status/effective-date filters, pagination, tenant-scoped expected-version predicate and atomic conflict | PASS |
| LegalRepresentativeRepository | tenant isolation, missing/cross-tenant profile FK rejection, soft deletion, active/effective-date filters, pagination, tenant-scoped expected-version predicate and atomic conflict | PASS |
| OtecResolutionRepository | tenant isolation, missing/cross-tenant profile FK rejection, soft deletion, active-number partial uniqueness/reuse, status/effective-date filters, pagination, tenant-scoped expected-version predicate and atomic conflict, supersession transaction | PASS |

Legal representatives intentionally have no partial unique business index because the approved data dictionary defines no reusable unique representative identifier. The integration contract verifies that the repository does not invent an undocumented RUT uniqueness rule.

## Resolution Supersession

- Valid same-tenant/profile supersession links the replacement and marks the replaced record `SUPERSEDED` in one transaction.
- The replaced resolution is excluded from active/effective search results after supersession.
- Self-supersession is rejected before persistence.
- Cross-tenant supersession is rejected without modifying or disclosing the foreign record.
- Indirect cycles are detected by traversing the existing supersession chain.
- A stale version on either record rolls back both updates.
- The database FK is composite over `(supersedes_resolution_id, organization_id)`.

## Reference Ports

- `OrganizationComplianceReadPort` exposes only the projection required by OTEC Compliance.
- `TenantDocumentOwnershipPort` returns ownership as a boolean and does not disclose a foreign document.
- Both Prisma adapters remain in infrastructure and import no foreign module domain entities or repositories.

## Quality Evidence

- Regulatory-record PostgreSQL gate: 1 file, 30 tests passed.
- Six-repository/reference PostgreSQL gate: 3 files, 36 tests passed.
- Full unit/integration suite: 23 files, 190 tests passed, 0 failed, 0 skipped.
- Full backend E2E suite: 3 files, 16 tests passed, 0 failed, 0 skipped.
- `npm run lint`: passed.
- `npm run build`: passed.
- `npm run prisma:validate`: passed.
- `npx prisma migrate deploy`: all five migrations applied from an empty, separately named disposable database.
- Empty-database catalog verification: six regulatory tables, six composite tenant/profile foreign keys, four applicable regulatory-record partial unique indexes, and five successful Prisma migration records.
- Pre/post full-test OTEC counts matched at zero for all six regulatory tables; the separately named migration-validation database was removed after verification.
- No historical migration was modified during this checkpoint.

## Checkpoint Files

- `src/modules/otec-compliance/infrastructure/prisma/prisma-otec-regulatory-record.repositories.integration.test.ts`
- `openspec/changes/add-otec-compliance-foundation/tasks.md`
- `openspec/changes/add-otec-compliance-foundation/reports/2026-07-16-step-6-repository-integration.md`

No repository implementation, frontend, HTTP controller, external integration, or migration file changed during this checkpoint.

## Risks and Debt

- Legal-representative active RUT uniqueness remains a functional/domain decision; no rule was inferred.
- Cycle detection and writes execute transactionally, but concurrent insertion of a different supersession edge may require transaction isolation/locking review under higher write contention.
- Document ownership is available as a port but must be invoked by application use cases before saving optional document references.
- Prisma delegates are adapted behind a typed generic repository boundary; generated delegate signature changes should be covered during Prisma upgrades.
- Immutable revision history remains Phase 2 debt; current history relies on effective dates, soft deletion, and supersession.

## Decision

**GO for application use-case TDD.** Repository persistence, tenant isolation, concurrency, referential integrity, and migration gates pass. HTTP and frontend work remain explicitly out of scope for this checkpoint.
