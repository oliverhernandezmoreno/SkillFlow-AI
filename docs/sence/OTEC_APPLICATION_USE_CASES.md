# OTEC Compliance Application Use Cases

## Contract Rules

All tenant identity comes from `UseCaseContext.organizationId`; inputs never control it. Application outputs are typed DTOs or domain projections and do not expose Prisma models. Commands that mutate an existing aggregate require `expectedVersion`; repositories include tenant, identifier, and version in the persistence predicate. Unless explicitly noted in the gaps section, commands execute persistence and `AuditLogger` in one `OtecComplianceTransactionManager` unit of work. Queries are read-only and are not audited as mutations.

`OTEC_COMPLIANCE` is the module entitlement. Feature names are `profile`, `accreditations`, `certifications`, `offices`, `representatives`, `resolutions`, `readiness`, and `expirations`. Permissions are enforced in application code from `UseCaseContext.permissions`; transport guards remain optional defense in depth.

Common application errors are `ValidationError`, `NotFoundError` (including cross-tenant non-disclosure), `ConflictError`, and `ModuleUnavailableError`. Mutations may also report domain transition errors. List outputs use `PaginatedResult<T>` with deterministic repository ordering and exclude soft-deleted records by default.

## Final Inventory

| Aggregate/capability | Use cases | Type | Input and output | Entitlement / future permission | Version, transaction, audit | Status and evidence |
|---|---|---|---|---|---|---|
| OTEC profile | Create, Get, Update, Deactivate | Command, Query | Tenant singleton: Get accepts context only; Update/Deactivate accept changes plus `expectedVersion`, never `profileId` | `profile` / `otec_compliance.profile.manage`; reads / `otec_compliance.read` | Commands resolve the current tenant profile and use one unit of work and atomic audit; update/deactivate versioned | Implemented; application, PostgreSQL singleton/concurrency, and rollback tests |
| Accreditation | Create, List, Get, Update, Suspend, Revoke | Command, Query | Typed accreditation DTOs; list filters and pagination; mutations accept `expectedVersion` except create | `accreditations` / `otec_compliance.accreditation.manage`; reads / `otec_compliance.read` | Commands use unit of work and audit; version predicate for existing records | Implemented; application and PostgreSQL repository tests |
| Quality certification | Create, List, Get, Update, Deactivate | Command, Query | Typed certification DTOs; type/status/validity filters and pagination; mutations accept `expectedVersion` except create | `certifications` / `otec_compliance.certification.manage`; reads / `otec_compliance.read` | Commands use unit of work and audit; version predicate for existing records | Implemented; application/readiness/PostgreSQL tests |
| Office | Create, List, Get, Update, Deactivate | Command, Query | Typed office DTOs; filters and pagination; mutations accept `expectedVersion` except create | `offices` / `otec_compliance.office.manage`; reads / `otec_compliance.read` | Commands use unit of work and audit; version predicate for existing records | Implemented; application and PostgreSQL tests |
| Legal representative | Create, List, Get, Update, Deactivate | Command, Query | Typed representative DTOs; filters and pagination; mutations accept `expectedVersion` except create | `representatives` / `otec_compliance.representative.manage`; reads / `otec_compliance.read` | Commands use unit of work and redacted audit; version predicate for existing records | Implemented; application and PostgreSQL tests |
| Resolution | Create, List, Get, Update, Supersede, Deactivate | Command, Query | Typed resolution DTOs; filters and pagination; existing-record mutations accept version; supersede accepts both expected versions | `resolutions` / `otec_compliance.resolution.manage`; reads / `otec_compliance.read` | Commands use unit of work and audit; supersession is atomic | Implemented; application, concurrency, and PostgreSQL chain tests |
| Readiness | EvaluateOtecReadiness | Query | `{ profileId, evaluationDate? }` to evidence-rich readiness result | `readiness` / `otec_compliance.readiness.evaluate` | No write transaction or audit | Implemented; integral evaluator, application, and snapshot tests |
| Compliance summary | GetOtecComplianceSummary | Query | Readiness input to `{ profileId, status, evaluatedAt, policyVersion, counts, expiringItems }` | `readiness` / `otec_compliance.read` | Projection of Evaluate; no write or audit | Implemented in 7.10.4; application and PostgreSQL tests |
| Expiration list | GetExpiringComplianceItems | Query | `{ profileId, evaluationDate?, windowDays?, page, pageSize }` to paginated exceptional items | `expirations` / `otec_compliance.read` | One tenant snapshot; no write or audit | Implemented in 7.10.4; classifier/application/PostgreSQL tests |
| Activity preparation | ValidateOtecCanPrepareSenceActivity | Query | Readiness input to `{ canPrepare, readinessStatus, blockingCodes, findings, internalOnly }` | `readiness` / `otec_compliance.readiness.evaluate` | Projection of Evaluate; no write or audit | Implemented in 7.10.4; application and PostgreSQL tests |

All use cases are eligible for a future delivery adapter under their declared permission, but this document deliberately defines no transport path, verb, status code, or HTTP DTO.

The productive backend transport decision is recorded in `OTEC_HTTP_CONTRACTS.md`. Activity preparation remains internal-only, findings/blocking queries remain superseded, and profile activation remains not applicable.

## OtecProfile Singleton Semantics

The current OTEC profile is the unique same-tenant record with status `ACTIVE` and `deletedAt = null`. `GetOtecProfile.execute(context)`, `UpdateOtecProfile.execute(input, context)`, and `DeactivateOtecProfile.execute(input, context)` resolve it through `UseCaseContext.organizationId`; none accepts a profile or organization identifier. The repository uses `findCurrentByOrganizationId` and never chooses by creation time, update time, or ID.

Deactivation changes the profile to `INACTIVE`, soft-deletes it, and increments its version atomically with audit persistence. A tenant with only an inactive/soft-deleted historical profile has no current profile and receives `NotFoundError`. `CreateOtecProfile` remains unchanged: an existing current profile conflicts, while recreation after deactivation is permitted by the existing partial unique index. No `ActivateOtecProfile` operation exists or is introduced.

## Query Semantics

- Readiness, summary, and activity preparation use an explicit `evaluationDate` or the injected `Clock` and one consolidated evaluator result.
- Expiration uses the effective settings window unless `windowDays` is supplied, UTC calendar-day semantics matching PostgreSQL `DATE`, and states `EXPIRED`, `EXPIRING_SOON`, `UNDATED`, `SUSPENDED`, and `REVOKED`.
- Expiration order is state priority, remaining days, entity type, then identifier. Inactive, draft, cancelled, closed, superseded, future, and soft-deleted records are excluded as applicable.
- Findings and blocking-items standalone queries are intentionally absent: `EvaluateOtecReadiness` already returns the stable, deterministically ordered projections.
- Readiness history is not persisted. Historical evaluation is available through `evaluationDate`; no migration is authorized.

## Formal 7.9–7.10 Decision Matrix

| Capability | Decision | Replacement/evidence | Impact or future phase |
|---|---|---|---|
| Readiness evaluation | COMPLETED | `EvaluateOtecReadinessUseCase`, evaluator and snapshot tests | Stable application query |
| Compliance summary | COMPLETED | `GetOtecComplianceSummaryUseCase` and query tests | Eligible for future delivery adapter |
| Expiration listing | COMPLETED | `GetExpiringComplianceItemsUseCase`, classifier and PostgreSQL tests | Eligible for future delivery adapter |
| Activity-preparation validation | COMPLETED | `ValidateOtecCanPrepareSenceActivityUseCase` and query tests | Internal preparation only; no official validation |
| Findings query | SUPERSEDED_BY | `EvaluateOtecReadinessUseCase.result.findings` | Avoids duplicate rules and contracts |
| Blocking-items query | SUPERSEDED_BY | Filtered blocking findings in Evaluate and activity validation | Avoids duplicate rules and contracts |
| Readiness history persistence | EXCLUDED_BY_DESIGN | Explicit `evaluationDate`; no approved persistence | Reconsider only through a separately approved migration |
| Current resolution/history as 7.9–7.10 work | NOT_APPLICABLE | Existing Get/List resolution use cases and terminal-chain evaluator projection | Resolution behavior belongs to 7.7–7.8 |
| Permission enforcement | COMPLETED | Application authorization policy, per-slice access helpers, permission seeds and tests | HTTP may add defense in depth only |
| Query audit writes | EXCLUDED_BY_DESIGN | Queries are read-only; no approved sensitive-read audit policy | No side effect introduced |

## Application Security Hardening

All 35 existing operations now apply tenant context, entitlement feature, and the declared permission before resource access. Commands use aggregate-specific manage permissions; ordinary queries use `otec_compliance.read`; readiness evaluation and activity preparation use `otec_compliance.readiness.evaluate`. `ActivateOtecProfile` is not an existing canonical operation and remains `NOT_APPLICABLE` rather than adding an unauthorized capability.

The existing demo administrator role receives the eight permission codes through an idempotent seed. Permission alone never enables the module: tenant entitlement remains independently required. Profile create/update/deactivate persist data and audit in the same OTEC unit of work.
