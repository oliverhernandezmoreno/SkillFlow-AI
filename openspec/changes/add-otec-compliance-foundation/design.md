## Context

SkillFlow AI is a TypeScript/Express/Prisma modular monolith with consistent domain, application, infrastructure, and HTTP layers. Tenant identity is carried in authenticated use-case context; repositories generally scope data with `organizationId`; route-level RBAC and persistent audit logging already exist. The SENCE module manages local declarations and evidence preparation but explicitly uses a manual submission stub.

The product lacks an OTEC regulatory configuration boundary, module-entitlement infrastructure, real optimistic concurrency, a document application service, and an event dispatcher/outbox. Phase 1 must add an independently controllable OTEC Compliance module without coupling it to internal Courses, Training Sessions, Documents, Notifications, or SENCE implementations and without claiming official validation.

Stakeholders are tenant OTEC administrators/operators, compliance managers, auditors, platform administrators, product/engineering, QA, and Chilean OTEC/SENCE domain reviewers. Regulatory interpretations remain subject to human validation and effective-date tracking.

## Goals / Non-Goals

**Goals:**

- Establish an independently entitled `OTEC_COMPLIANCE` bounded context.
- Manage internal OTEC profile, accreditation, quality certification, office, legal representative, and resolution antecedents per tenant.
- Enforce tenant isolation, RBAC, soft deletion, auditability, input validation, and real optimistic concurrency.
- Evaluate configurable readiness and expiration evidence as `READY`, `READY_WITH_WARNINGS`, or `NOT_READY`.
- Provide versioned REST APIs, a connected frontend workspace, incremental persistence, fictitious seed data, OpenAPI, and full test traceability.
- Create extension points for documents, activity preparation, subscriptions, notifications, and future integrations.

**Non-Goals:**

- Official SENCE, RUDO, OTIC, or LCE connectivity or validation.
- Communication, rectification, annulment, pre-liquidation, liquidation, billing, or tax-credit computation.
- Real electronic signatures, biometrics, e-learning control, emails, SMS, scheduled jobs, or a complete document platform.
- A billing engine, generalized policy engine, microservice extraction, or rewriting stable modules.
- Treating stored identifiers or syntactically valid values as proof of official validity.

## Decisions

### 1. Dedicated bounded context with ports

Create `src/modules/otec-compliance` following the existing module shape. It owns regulatory antecedents, readiness rules, application contracts, persistence, and HTTP delivery. External data is accessed through narrow ports:

- `OrganizationComplianceReadPort`
- `TenantDocumentOwnershipPort`
- `ModuleEntitlementPort`
- `AuditLogger`
- Future `SenceActivityPreparationGatePort` and notification/integration ports

Direct imports of other modules' Prisma repositories, entities, or internal services are prohibited. Initial port adapters may use Prisma read queries in infrastructure where no public application service exists, but the domain contract remains stable.

**Alternative considered:** Extend the current SENCE module. Rejected because tenant OTEC accreditation/configuration has a distinct lifecycle and must remain reusable without declaration workflows.

### 2. Minimal reusable module entitlement

Add a small tenant module-entitlement model and application contract supporting `ENABLED`, `DISABLED`, `SUSPENDED`, `EXPIRED`, and `PLAN_RESTRICTED`, effective dates, feature keys, tenant, soft delete, and version. It is authorization infrastructure, not billing. OTEC routes apply entitlement middleware before permissions and domain actions.

**Alternative considered:** A boolean on `OtecProfile`. Rejected because it couples commercial availability to domain data and cannot distinguish suspended/expired/plan-restricted outcomes.

### 3. Aggregate boundaries

`OtecProfile` is the aggregate root for profile identity and active/deactivated lifecycle. Accreditations, certifications, offices, representatives, and resolutions have independent repositories because they are listed, versioned, and transitioned independently, while every operation verifies the same-tenant active profile.

`ComplianceContact` remains embedded in `OtecProfile`; multiplicity/history behavior does not justify a separate entity in Phase 1. Organization-owned legal name and tax ID are read via port rather than duplicated. A regulatory snapshot may be added only if a future communicated payload requires immutable historical evidence.

### 4. Effective-dated, configurable rules

Rule definitions use stable codes and metadata: category, modality applicability, effective dates, source reference/version, severity, inputs, expected result, exceptions, configuration key, tests, and validation status. Phase 1 implements internal rules `OTEC-FOUND-001`, `OTEC-ACC-001`, `OTEC-QUAL-001`, `OTEC-OFF-001`, `OTEC-REP-001`, `OTEC-RES-001`, `OTEC-DOC-001`, `OTEC-TENANT-001`, `OTEC-DATE-001`, and `OTEC-VERSION-001`.

Mutable requirements—NCh2728 obligation, required resolution types, warning windows, and treatment of undated records—are tenant/effective configuration. Regulatory source text is not copied into code. Unvalidated interpretations remain labeled `REQUIRES_FUNCTIONAL_VALIDATION`.

**Alternative considered:** Hardcoded constants. Rejected because regulatory applicability and effective periods can change.

### 5. Derived expiration state

Persist lifecycle states such as draft, active, suspended, revoked, cancelled, and inactive. Derive expired/expiring/undated classifications at the evaluation date. `EXPIRING` is not persisted because it changes with time without a business transition.

### 6. Optimistic concurrency in repository predicates

Every mutation accepts `expectedVersion`. Prisma adapters execute `updateMany` or equivalent with `id`, `organizationId`, `version: expectedVersion`, and `deletedAt: null`; exactly one affected row is required. The update increments `version` atomically. Zero affected rows triggers a safe conflict lookup strategy and maps to HTTP 409. The conflict attempt is audited without exposing foreign records.

**Alternative considered:** Read, mutate entity, then update by ID. Rejected because it permits lost updates and the current version increment alone is not concurrency control.

### 7. Soft-delete-aware uniqueness

The migration uses PostgreSQL partial unique indexes for one active profile per organization and active tenant-scoped business identifiers where reuse is valid. Prisma schema expresses normal indexes and the SQL migration carries partial unique constraints that Prisma cannot model directly. Repository conflict mapping translates unique violations into domain conflicts.

### 8. Readiness evaluation is pure domain logic

Application services load an authorized snapshot containing organization, profile, antecedents, and effective configuration. `OtecReadinessEvaluator` is deterministic for an injected evaluation date. It returns categorized checks, blockers, warnings, passed checks, expiring/missing items, remediation, and a score. Blocking severity always overrides the score.

This makes historical evaluation testable and keeps Prisma/time/HTTP concerns outside domain logic.

### 9. Audit consistency strategy

Critical business mutation and AuditEvent persistence must share a Prisma transaction. Add a transaction-aware audit adapter or a module unit-of-work contract rather than silently logging after commit. Readiness evaluations also persist an audit event but do not store full PII or large snapshots. Correlation ID is added compatibly to use-case context/audit metadata unless a schema column is justified during implementation.

An outbox is documented as Phase 2 debt for external integration events. No in-memory event publishing is presented as durable.

### 10. HTTP and error behavior

Routes follow `/api/v1/otec-compliance`. Tenant identity comes only from auth context. Validators reject mass-assigned tenant fields. Existing 401/403/404/validation conventions are retained; a typed `ConflictError` maps stale versions and active uniqueness conflicts to 409. Module-unavailable outcomes use 403 with specific safe error codes because entitlement is an authorization precondition, not resource existence.

### 11. Frontend workspace architecture

Add a Settings → OTEC Compliance navigation entry and feature services/hooks using the existing API client and TanStack Query. React Hook Form and Zod handle forms. The workspace uses separate views/tabs for summary, profile, antecedent categories, and expirations, while shared visual components render status and conflict/forbidden/module-unavailable states.

Mutations invalidate narrow query keys. A 409 preserves safe draft input and prompts reload. Destructive transitions use the existing confirmation dialog. No official-system logos or integration language are used.

### 12. Test and delivery approach

Implementation is split into small RED/GREEN/REFACTOR slices: entitlement; value objects/entities; readiness; each repository; each use-case group; HTTP/RBAC; frontend. Repository and HTTP integration tests use a disposable PostgreSQL database. The agent records pre/post database state and restores test mutations. OpenAPI drift, migration validation, curl testing, and browser E2E are release gates when applicable tooling is available.

## Risks / Trade-offs

- **Regulatory interpretation becomes stale** → Store source/effective/validation metadata, keep mutable behavior configured, and require domain-owner review.
- **Minimal entitlement becomes accidental billing architecture** → Restrict it to access state/effective dates/features and expose a port; no prices, invoices, or subscriptions.
- **Direct Prisma read adapters preserve some coupling** → Keep them infrastructure-only behind ports and replace with public application services when those modules mature.
- **Partial indexes are not fully represented in Prisma schema** → Document them in data dictionary and test migration/database uniqueness explicitly.
- **Audit transaction changes shared infrastructure** → Add backward-compatible transaction support and targeted regression tests; avoid broad rewrites.
- **Large Phase 1 surface increases delivery risk** → Implement aggregate slices sequentially and keep the application unusable until the entitlement/readiness core passes.
- **Document references cannot prove evidence quality** → Validate tenant ownership only and label documentary verification as pending.
- **Historical evaluation lacks full bitemporal history after updates** → Soft-deleted/superseded records and effective dates provide partial history; immutable revisions are Phase 2 debt.
- **Permission changes remain stale in JWTs** → Document this existing risk; full session/claim revocation is outside Phase 1.
- **No durable event system** → Do not emit external integration events; record future outbox contracts only.

## Migration Plan

1. Create and review Phase 0 documents, specifications, traceability, and regulatory assumptions.
2. Create a feature branch before implementation as mandated by project workflow.
3. Add tests for schema-facing behavior and generate an additive Prisma migration.
4. Apply the migration only to a disposable development/test database and validate indexes/constraints.
5. Deploy code with all existing tenants lacking an OTEC entitlement, so the module is unavailable by default.
6. Seed only clearly fictitious demo OTEC records and an enabled demo entitlement.
7. Verify old API/module behavior, database state, and OpenAPI compatibility.
8. Enable selected pilot tenants explicitly after data validation.

Rollback disables entitlements first. Application code can then be rolled back while additive tables remain unused. Dropping tables or data is not part of automated rollback; a later reviewed cleanup migration would be required.

## Open Questions

- Human validation is required for default NCh2728 applicability, undated-record treatment, qualifying office types, required resolution types, and persisted registration/accreditation vocabulary.
- The implementation should default unresolved regulatory choices to configurable, non-official internal rules and mark them `REQUIRES_FUNCTIONAL_VALIDATION`.
- Confirm whether correlation ID warrants a dedicated AuditEvent column or remains structured metadata; the implementation spike must preserve existing audit consumers.
- Confirm Playwright MCP availability during implementation; if unavailable, record the tooling limitation and run the strongest available browser test alternative without marking unsupported evidence as executed.
