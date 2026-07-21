# SkillFlow OTEC Compliance Architecture

## Architecture Decision Record

**Status:** Proposed for Phase 1 implementation  
**Module name:** SkillFlow OTEC Compliance  
**Technical boundary:** `otec-compliance`  
**Commercial module code:** `OTEC_COMPLIANCE`

## Context

The existing SENCE module prepares local declaration evidence and records manual stub status. OTEC organizational antecedents have a different lifecycle, security boundary, and reuse potential. The solution therefore adds a bounded context within the modular monolith, prepared for future extraction but not prematurely distributed.

## Decision

Create a self-contained OTEC Compliance module using the repository's domain/application/infrastructure/interface layers. It owns internal OTEC antecedents, effective rule configuration, readiness evaluation, expiration views, and its HTTP/frontend contracts. It does not own Organizations, Documents, Courses, Sessions, Notifications, SENCE declarations, or billing.

## Logical Architecture

```text
Authenticated HTTP request
        |
        v
Tenant context -> Module entitlement -> Feature access -> RBAC permission
        |                                                    |
        +---------------------- allowed ----------------------+
                                |
                                v
                    OTEC Compliance use case
                                |
               +----------------+----------------+
               |                |                |
               v                v                v
        Domain aggregates   Readiness rules   Audit/unit of work
               |                |                |
               +----------------+----------------+
                                |
                                v
                      Repository/read ports
                                |
         +----------------------+-----------------------+
         |                      |                       |
         v                      v                       v
   OTEC Prisma data   Organization read adapter   Document ownership adapter
```

## Module Structure

```text
src/modules/otec-compliance/
├── application/
│   ├── dto/
│   ├── mappers/
│   ├── ports/
│   ├── services/
│   └── use-cases/
├── domain/
│   ├── entities/
│   ├── repositories/
│   ├── services/
│   └── value-objects/
├── infrastructure/
│   └── prisma/
├── interfaces/http/
│   ├── controllers/
│   ├── middlewares/
│   ├── routes/
│   └── validators/
└── tests grouped by behavioral slice
```

## Owned Aggregates and Services

- `OtecProfile`
- `OtecAccreditation`
- `QualityCertification`
- `OtecOffice`
- `LegalRepresentative`
- `OtecResolution`
- `OtecComplianceSettings`
- `OtecReadinessEvaluator`
- Expiration classifier

Module entitlement is a minimal shared platform capability exposed through `ModuleEntitlementPort`; it is not embedded in OTEC domain records.

## Public Ports

| Port | Direction | Purpose |
|---|---|---|
| OrganizationComplianceReadPort | Inbound dependency | Read same-tenant organization type/status/legal display data |
| TenantDocumentOwnershipPort | Inbound dependency | Validate optional document ownership only |
| ModuleEntitlementPort | Inbound dependency | Resolve module/feature availability |
| AuditLogger/ComplianceUnitOfWork | Inbound dependency | Persist critical audit evidence atomically |
| OtecReadinessPort | Outbound public contract | Allow future SENCE activity preparation to query readiness without internals |
| OtecComplianceQueryService | Outbound public contract | Authorized summary/expiration projections |

## Dependency Rules

- Domain code imports no Prisma, Express, frontend, or other module internals.
- Application code depends on ports and domain contracts.
- Prisma and cross-module read adapters live in infrastructure.
- Existing SENCE code must consume a public readiness port in a future change, never OTEC repositories directly.
- No connector or domain event is presented as durable until an outbox exists.
- IDs may cross boundaries; mutable internal entities may not.

## Authorization Architecture

The required evaluation order is:

```text
authenticated user
→ organization context
→ OTEC_COMPLIANCE entitlement effective
→ requested feature enabled
→ required permission present
→ request validation
→ tenant-scoped resource lookup
→ domain invariant/rule
```

Tenant identity is never accepted from ordinary client payloads or filters. Cross-tenant resources use the repository-standard non-disclosure response.

## Permission Model

- `otec_compliance.read`
- `otec_compliance.manage`
- `otec_compliance.profile.manage`
- `otec_compliance.accreditation.manage`
- `otec_compliance.certification.manage`
- `otec_compliance.office.manage`
- `otec_compliance.representative.manage`
- `otec_compliance.resolution.manage`
- `otec_compliance.readiness.evaluate`
- `otec_compliance.audit.read`

Role mappings are documented separately and do not replace permission checks.

## Persistence Architecture

- Additive Prisma schema and migration only.
- Tenant ID on every record and relation.
- Soft delete and active-record filters.
- Partial unique PostgreSQL indexes for active uniqueness.
- Status/validity/tenant indexes for queries.
- Expected-version predicate for every mutation.
- Transactions for multi-write critical behavior and audit.
- No regulatory logic inside Prisma adapters.

OtecProfile is delivered as a tenant-scoped singleton whose current value is the unique `ACTIVE`, non-deleted profile. PostgreSQL enforces this with `otec_profiles_one_active_per_organization`; application resolves it through `findCurrentByOrganizationId(organizationId)` after entitlement and permission checks. Historical soft-deleted profiles may coexist, but are never selected as current. Update and deactivation retain the resolved internal ID, tenant ID, and `expectedVersion` in the repository predicate and share their transaction with audit persistence.

## Readiness Architecture

The application loads a same-tenant snapshot and an effective rule configuration, then invokes a pure evaluator with an explicit evaluation time. The evaluator produces checks with rule/source traceability. Status logic is:

```text
any blocking failure -> NOT_READY
else any warning     -> READY_WITH_WARNINGS
else                 -> READY
```

Score is informational and cannot override blockers. Expiration is derived at evaluation time.

`EvaluateOtecReadinessUseCase` derives the tenant from `UseCaseContext`, verifies the `readiness` entitlement feature, uses an explicit evaluation date or an injected clock, loads a projection through `OtecReadinessSnapshotReadPort`, and invokes the evaluator. It performs no persistence or audit write.

The Prisma snapshot adapter performs eight projected reads—organization, profile, effective settings, and five regulatory record collections—inside one bounded PostgreSQL `REPEATABLE READ` transaction. Entitlement evaluation is one preceding authorization query. This avoids an N+1 pattern and provides a consistent multi-aggregate view without serializable isolation. Resolution classification is linear in the number of loaded resolutions and uses the persisted/derived terminal relationship; repository cycle prevention remains the write-side invariant.

The current projection loads every non-deleted record for one profile. This is appropriate for the foundation dataset but can become a memory/performance risk for long histories. A future optimization may add date/status projection predicates or immutable historical revisions after workload measurement; no cache is introduced in Phase 1.

`GetOtecComplianceSummaryUseCase` and `ValidateOtecCanPrepareSenceActivityUseCase` are read-only projections of `EvaluateOtecReadinessUseCase`; they do not duplicate regulatory rules. `GetExpiringComplianceItemsUseCase` uses the same tenant snapshot and effective policy window plus a reusable domain classifier. Effective dates use inclusive UTC calendar days to match PostgreSQL `DATE` values. Findings and blocking-items queries are consolidated into the readiness result, and historical evaluation uses `evaluationDate` without new persistence.

Application code enforces permissions from authenticated `UseCaseContext` after entitlement and feature evaluation and before tenant-scoped resource access. Eight `otec_compliance.*` permissions are seeded idempotently through the existing Permission/RolePermission model for the existing demo administrator role. HTTP guards may later add defense in depth but cannot replace application enforcement. This hardening adds no HTTP guard, route, DTO, or endpoint contract.

OtecProfile commands now use `PrismaOtecComplianceTransactionManager`: profile persistence and `AuditLogger` share one transaction, so persistence, version changes, and audit either commit or roll back together.

## API and Frontend

HTTP transport is defined in `OTEC_HTTP_CONTRACTS.md` and its productive OpenAPI contract. Resource-specific thin controllers use strict Zod DTOs, `page/pageSize`, explicit transition subresources, authenticated `UseCaseContext`, safe error mapping, and weak version ETags. The approved routes are registered under `/api/v1/otec-compliance`; internal activity validation remains unexposed.

The API is additive under `/api/v1/otec-compliance`. Mutations require expected versions and map stale data to 409. OpenAPI describes all permissions, filters, responses, examples, and disclaimers.

The frontend adds Settings → OTEC Compliance with connected summary, profile, antecedent, and expiration views. It handles loading, empty, forbidden, module unavailable, validation, conflict, and destructive confirmation states without static regulatory results.

## Audit and Privacy

Critical mutations and audit persistence share a transaction strategy. Audit records include tenant, actor, entity, action, before/after, IP, user agent, safe correlation metadata, and rule codes. Complete RUT values, document bodies, secrets, and unnecessary PII are excluded from general metadata/logs.

## Deployment and Rollback

The module is unavailable by default for existing tenants. Deploy additive schema/code first, then explicitly enable a validated pilot/demo entitlement. Rollback disables entitlements before application rollback. No automated destructive schema rollback is authorized.

## Deferred Architecture

- Transactional outbox and integration-event delivery.
- Full document bounded context.
- Durable jobs/notifications.
- Regulatory activity aggregate and immutable communication versions.
- Official connectors and reconciliation.
- Database row-level security, enterprise identity, and broad subscription/billing platform.

## Consequences

The module can evolve independently and provide an honest internal readiness gate. The trade-off is additional ports, configuration, and persistence before visible SENCE automation. This is intentional: regulatory truth, tenant security, concurrency, and auditability take priority over simulated integration speed.
