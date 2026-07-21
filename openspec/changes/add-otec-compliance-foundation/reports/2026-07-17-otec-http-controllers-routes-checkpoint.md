# OTEC Compliance Productive HTTP Checkpoint

**Date:** 2026-07-17  
**Branch:** `feature/add-otec-compliance-foundation-backend`  
**Resumed from:** OpenSpec 8.3.2, immediately after approved 8.3.1 inventory and singleton compatibility.

## Delivered scope

Productive thin controllers and routes are registered under `/api/v1/otec-compliance` for the tenant singleton profile; accreditation, quality certification, office, legal representative, and resolution records; readiness evaluation; compliance summary; and expiring items. `ValidateOtecCanPrepareSenceActivity` remains `INTERNAL_ONLY` and has no public route.

The transport pipeline is authentication → module feature entitlement → permission defense in depth → strict Zod validation → thin controller → existing application use case → presenter/error mapper. Application authorization remains active and is not replaced by HTTP guards. Controllers import neither Prisma nor repositories and contain no regulatory evaluation, persistence, transaction, or audit logic.

Authenticated `UseCaseContext` supplies `organizationId`, actor, permissions, correlation identifier, IP, and user agent. Strict bodies reject tenant/actor/permission fields. Response presentation removes `organizationId`, `deletedAt`, and internal metadata.

Existing-resource mutations require `If-Match: W/"vN"`; controllers pass only the parsed `expectedVersion` to application and return the resulting `ETag`. Profile remains a tenant singleton without `profileId` in get, update, or deactivation routes.

## TDD evidence

- **RED:** missing Profile controller; missing record controllers/router; stale design-only OpenAPI; missing HTTP/PostgreSQL flows.
- **GREEN:** resource-specific controllers, shared transport adapter, authenticated composition root, productive router, schemas, context mapping, safe errors, and OpenAPI were added until each focused suite passed.
- **REFACTOR:** shared record controller, presenter, concurrency parser, validation middleware, Express async adapter, and composition wrappers removed resource duplication while retaining separate resource controller boundaries.

Added HTTP tests:

- `otec-profile.controller.test.ts`: 3 singleton mapping/concurrency tests.
- `otec-record.controller.test.ts`: 12 parameterized resource/transition tests across five controllers.
- `otec-compliance.routes.test.ts`: 10 authentication, route-manifest, entitlement, permission, validation, context, safe error, and concurrency tests.
- `otec-compliance.http.e2e.test.ts`: 4 PostgreSQL-backed end-to-end tests covering all five regulatory resources and all three public readiness/query projections.
- OpenAPI contract now has 5 assertions including 34 unique operation identifiers, router-manifest parity, and main-spec linkage.

The PostgreSQL E2E race issued two Profile PATCH requests with the same `W/"v1"` precondition: exactly one returned 200, one returned 409, and the stored version was 2. A known accreditation identifier requested by the second tenant returned the same sanitized 404 body as a missing identifier. The suite created/listed one record for every regulatory repository and removed all fixtures; the final direct count for its organizations, users, profiles, and audits was `0`.

## Productive endpoint results

| Resource | Operations | Result |
|---|---|---|
| OtecProfile singleton | create, get, update, deactivate | Controller/router/unit and PostgreSQL concurrency flow green |
| OtecAccreditation | create, list, get, update, suspend, revoke | Controller/router and PostgreSQL create/list/non-disclosure green |
| QualityCertification | create, list, get, update, deactivate | Controller/router and PostgreSQL create/list green |
| OtecOffice | create, list, get, update, deactivate | Controller/router and PostgreSQL create/list green |
| LegalRepresentative | create, list, get, update, deactivate | Controller/router and PostgreSQL create/list green |
| OtecResolution | create, list, get, update, supersede, deactivate | Controller/router, two-version supersession mapping, and PostgreSQL create/list green |
| Readiness | evaluate | Productive PostgreSQL projection green; no official SENCE claim |
| Compliance summary | get | Productive PostgreSQL projection green |
| Expiring items | list | Productive PostgreSQL projection green |
| Activity preparation validation | none | Intentionally `INTERNAL_ONLY`; HTTP request returns 404 |

## Quality gates

| Command | Exit | Result | Duration |
|---|---:|---|---:|
| `npx vitest run src/modules/otec-compliance/interfaces/http` | 0 | 7 files, focused HTTP suite green | focused runs green |
| `npm test -- --run` | 0 | 45 files, 409 passed, 0 failed/skipped | 13.04 s |
| `npm run build` | 0 | TypeScript clean | 20.55 s |
| `npm run lint` | 0 | ESLint clean | completed without findings |
| `npm run prisma:validate` | 0 | Prisma schema valid | 2.19 s |
| `npx --no-install js-yaml docs/sence/OTEC_HTTP_CONTRACTS.openapi.yml` and `docs/api-spec.yml` | 0 | Both OpenAPI YAML documents parse | 0.65 s main specification |
| `openspec validate add-otec-compliance-foundation --strict` | 0 | Change valid | 0.39 s |
| `git diff --check` | 0 | No whitespace errors | < 1 s |
| PostgreSQL fixture count | 0 | E2E fixture residue `0` | < 1 s |

## Files created in this slice

- `src/modules/otec-compliance/interfaces/http/controllers/otec-profile.controller.ts`
- `src/modules/otec-compliance/interfaces/http/controllers/otec-record.controller.ts`
- five resource-specific controller classes and their controller tests
- `src/modules/otec-compliance/interfaces/http/controllers/otec-compliance-query.controller.ts`
- `src/modules/otec-compliance/interfaces/http/middlewares/validate-otec-request.middleware.ts`
- `src/modules/otec-compliance/interfaces/http/middlewares/otec-http-error.middleware.ts`
- `src/modules/otec-compliance/interfaces/http/routes/otec-http-composition.ts`
- `src/modules/otec-compliance/interfaces/http/routes/otec-compliance.routes.ts`
- router unit/integration and PostgreSQL E2E test files
- `src/modules/otec-compliance/infrastructure/prisma/prisma-module-entitlement.repository.ts`
- this checkpoint report

Modified in this slice: HTTP schemas/OpenAPI assertions, authenticated request context, entitlement middleware typing, API route registration, productive OTEC OpenAPI plus `docs/api-spec.yml` linkage, OTEC HTTP/application/architecture/traceability documentation, delta specification, and canonical OpenSpec tasks.

## Risks and debt

- The OpenAPI bodies use a strict generic object component; operation-specific field schemas and richer examples remain documentation debt even though runtime Zod schemas are specific.
- HTTP guards are defense in depth; application permission/entitlement enforcement remains intentionally duplicated as the authoritative boundary.
- Durable idempotency remains deferred; version preconditions protect existing-resource transitions but creates have no idempotency key.
- The E2E suite covers a representative persistence flow per regulatory resource. The larger repository and use-case suites remain the exhaustive matrix for every lifecycle edge and rollback case.
- No activity-validation endpoint exists because its application operation is explicitly internal-only.

No frontend, migration, historical migration edit, external integration, notification, worker, event bus, outbox, commit, push, tag, release, or deployment was added or performed in this slice.

## Decision

**GO to request separate authorization for the next backend block.** Productive OTEC HTTP delivery is consistent with current application boundaries, all required gates are green, PostgreSQL fixtures are clean, and no migration is required. Do not start the next block automatically.
