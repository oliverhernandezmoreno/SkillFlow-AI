# OtecProfile Tenant Singleton Compatibility

## Cardinality Evidence

| Aspect | State | Evidence | Risk |
|---|---|---|---|
| Uniqueness per tenant | Partial and intentional | `otec_profiles_one_active_per_organization` in the additive migration | The invariant covers only active, non-deleted profiles, not history |
| Multiple historical profiles | Yes | `OtecProfile.deactivate()` sets `INACTIVE` and `deletedAt`; repository integration permits reuse | Historical records must never be selected as current |
| Unique active profile | Yes | Partial unique index on `organization_id` where `deleted_at IS NULL AND status = 'ACTIVE'` | Prisma schema cannot express the filtered index; SQL migration and tests remain authoritative |
| Soft delete | Yes | Domain deactivation plus repository `deletedAt: null` predicates | An inactive non-deleted row created outside domain would not be current |
| Recreation after deactivation | Yes | Repository integration test `maps active uniqueness to conflict and permits reuse after soft deletion` | Consumers must distinguish current profile from historical IDs |

The approved singleton is therefore the unique profile with `registrationStatus = ACTIVE` and `deletedAt = null` for the authenticated organization. It is not the newest profile and is never chosen by ordering. A tenant with only historical profiles has no current singleton and receives `NotFoundError`.

## Compatibility Decision

`GetOtecProfile`, `UpdateOtecProfile`, and `DeactivateOtecProfile` will remove `profileId` from their public signatures. The repository will expose an explicit current-profile lookup scoped by organization. Update and deactivation will retain the internally resolved aggregate ID, organization ID, and caller-supplied `expectedVersion` in persistence predicates.

`CreateOtecProfile` remains unchanged: it rejects an existing current active profile and allows recreation after domain deactivation/soft deletion. No `ActivateOtecProfile` use case exists, and activation remains `NOT_APPLICABLE`; no new capability is introduced.

## Delivery Status

### RED → GREEN → REFACTOR

- RED changed Get, Update, and Deactivate tests to omit `profileId`: 10 tests ran, 5 failed because the old signatures misinterpreted context/input.
- GREEN added `findCurrentByOrganizationId`, tenant singleton application resolution, and the three unambiguous public signatures: profile tests became 10/10 green.
- REFACTOR moved shared not-found resolution to `findCurrentTenantProfileOrThrow`, updated every typed in-memory repository consumer, and added missing/historical, entitlement, RBAC, impossible-cardinality, repeated-deactivation, stale-version, rollback, and no-partial-mutation evidence.

### Final Signatures

- Previous: `GetOtecProfile.execute(profileId, context)`; final: `execute(context)`.
- Previous: `UpdateOtecProfile.execute(profileId, input, context)`; final: `execute(input, context)`.
- Previous: `DeactivateOtecProfile.execute(profileId, input, context)`; final: `execute(input, context)`.

The update predicate remains `id + organizationId + expectedVersion + deletedAt IS NULL`; the ID is resolved inside application and is not caller-controlled. Update and deactivation continue to mutate and audit inside `PrismaOtecComplianceTransactionManager`.

### PostgreSQL Evidence

- Focused repository/transaction suites: 2 files, 17/17 tests passed in 1.24 s after PostgreSQL access was enabled outside the network sandbox.
- Repository tests prove tenant-specific current lookup, no current result after soft deletion, deterministic recreation, stale-version rejection, and exactly one success from two updates using version 1.
- Transaction tests prove successful update/deactivation and audit commit together, and audit foreign-key failure rolls profile values/version back.
- Post-suite fixture query returned zero organizations, users, profiles, and audit events for every singleton test identifier.

### Quality Gates

| Command | Exit | Result |
|---|---:|---|
| `npx vitest run --config vitest.config.ts src/modules/otec-compliance/application/use-cases/otec-profile.use-cases.test.ts ...otec-http-contracts.test.ts ...otec-openapi-contract.test.ts` | 0 | 3 files, 23/23 passed |
| `npx vitest run --config vitest.config.ts ...prisma-otec-profile.repository.integration.test.ts ...prisma-otec-compliance-transaction-manager.integration.test.ts` | 0 | 2 files, 17/17 passed |
| `npm test` | 0 | 41 files, 377/377 passed, 0 failed/skipped, 7.01 s |
| `npm run build` | 0 | TypeScript build passed |
| `npm run lint` | 0 | ESLint passed |
| `npm run prisma:validate` | 0 | Prisma schema valid |
| `openspec validate add-otec-compliance-foundation --strict` | 0 | Change valid |
| `git diff --check` | 0 | No whitespace errors |

The first PostgreSQL attempt failed before test execution because sandboxed localhost access was unavailable; after starting/verifying the existing healthy repository container and running with approved local access, all tests executed successfully. No retries were used to hide a test failure.

### Final Decision

GO to request/resume the separately authorized controllers and routes block. The singleton invariant is database-backed, future profile controllers need no repository lookup, contracts require no path change, and no migration is required. `CreateOtecProfile` retains conflict/recreation behavior; `ActivateOtecProfile` remains absent and `NOT_APPLICABLE`.

No productive controller, route, frontend artifact, migration, external integration, commit, push, tag, release, or deployment was added in this slice.
