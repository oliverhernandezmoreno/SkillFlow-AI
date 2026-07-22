## 0. Setup: Create Feature Branch (MANDATORY - FIRST STEP)

- [x] 0.1 Create and switch to branch `feature/add-otec-compliance-foundation-backend` before production code changes
- [x] 0.2 Verify the branch, preserve pre-existing user changes, and record the baseline Git status

## 1. Phase 0 Specification Review

- [x] 1.1 Review the ten `docs/sence/` Phase 0 artifacts against repository evidence and OpenSpec requirements
- [x] 1.2 Obtain or record functional validation status for NCh2728 applicability, undated records, qualifying office types, and required resolution types
- [x] 1.3 Record unresolved regulatory choices as configuration with `REQUIRES_FUNCTIONAL_VALIDATION` status
- [x] 1.4 Confirm the traceability matrix maps every Phase 1 acceptance criterion to specifications and planned tests

## 2. Module Entitlement Foundation (TDD)

- [x] 2.1 RED: Add tests for enabled, disabled, suspended, expired, plan-restricted, missing, and cross-tenant OTEC module entitlements
- [x] 2.2 GREEN: Implement the minimal reusable module-entitlement domain contract and tenant-scoped behavior
- [x] 2.3 REFACTOR: Add entitlement middleware/service composition before OTEC permission and domain checks
- [x] 2.4 Verify the entitlement implementation contains no billing, price, invoice, or payment behavior

## 3. Value Objects and Domain Entities (TDD)

- [x] 3.1 RED: Add behavioral tests for date ranges, email/RUT reuse, identifiers, profile eligibility, lifecycle transitions, and version expectations
- [x] 3.2 GREEN: Implement OtecProfile, OtecAccreditation, QualityCertification, OtecOffice, LegalRepresentative, and OtecResolution entities/value objects
- [x] 3.3 GREEN: Implement explicit suspension, revocation, deactivation, and resolution-supersession behavior
- [x] 3.4 REFACTOR: Remove duplication while retaining clear aggregate boundaries and fully typed primitives

## 4. Readiness and Expiration Domain Services (TDD)

- [x] 4.1 RED: Add evaluator tests for READY, READY_WITH_WARNINGS, NOT_READY, blocking precedence, historical dates, and configurable windows
- [x] 4.2 RED: Add tests for every Phase 1 rule code, including optional NCh2728 and configured resolution types
- [x] 4.3 GREEN: Implement versioned rule configuration, OtecReadinessEvaluator, expiration classification, and remediation evidence
- [x] 4.4 REFACTOR: Keep evaluation deterministic and free of Prisma, HTTP, current-time, and external integration dependencies

## 5. Prisma Schema and Incremental Migration (TDD)

- [x] 5.1 Add schema-level tests or integration assertions for tenant relationships, indexes, effective dates, and active uniqueness
- [x] 5.2 Add Prisma enums/models for entitlements, settings, profiles, accreditations, certifications, offices, representatives, and resolutions
- [x] 5.3 Generate a new additive migration without changing historical migrations or resetting data
- [x] 5.4 Add PostgreSQL partial unique indexes for active profile and reusable active business identifiers
- [x] 5.5 Validate migration application and schema on a disposable database and document rollback limitations

## 6. Repository Ports and Prisma Adapters (TDD)

- [x] 6.1 RED: Add repository integration tests for pagination, filters, soft deletion, same-tenant reads, and cross-tenant non-disclosure
- [x] 6.2 RED: Add concurrency tests proving stale versions update zero rows and return conflicts
- [x] 6.3 GREEN: Implement the six repository interfaces and Prisma adapters with organization-scoped predicates
- [x] 6.4 GREEN: Implement expected-version update predicates and safe unique/conflict mapping
- [x] 6.5 GREEN: Implement organization-read and document-ownership port adapters without domain coupling
- [x] 6.6 RED: Complete PostgreSQL integration coverage for accreditation, certification, office, representative, and resolution repositories across tenant isolation, soft deletion, active uniqueness, status/effective-date filters, and pagination where applicable
- [x] 6.7 RED: Prove every regulatory repository mutation includes `expectedVersion` in the tenant-scoped predicate and reports stale-version conflicts without changing data
- [x] 6.8 RED: Prove database referential integrity and repository rejection of cross-tenant profile and related-record relationships for all five regulatory repositories
- [x] 6.9 RED: Complete OTEC resolution PostgreSQL integration coverage for valid supersession, replaced status, cross-tenant rejection, self-supersession, cycle prevention, and transactional concurrent conflict rollback
- [x] 6.10 GREEN/REFACTOR: Make only the minimal repository changes required by the completed PostgreSQL integration matrix
- [x] 6.11 Verify backend build, lint, full tests, Prisma schema validation, and additive migration application from an empty disposable PostgreSQL database without modifying historical migrations
- [x] 6.12 Record repository-by-repository results, commands, modified files, risks, debt, and the GO/NO-GO checkpoint for starting use cases in an OpenSpec report

## 7. Application Use Cases and Audit (TDD)

- [x] 7.1 RED: Add use-case tests for profile creation/read/update/deactivation and OTEC organization eligibility
- [x] 7.2 GREEN: Implement OtecProfile use cases and audit behavior

### 7.2.6 OtecProfile Tenant Singleton Compatibility

- [x] 7.2.6.1 Record schema, migration, domain, repository, and test evidence for the active non-deleted profile singleton and historical recreation behavior
- [x] 7.2.6.2 RED: Add application tests proving Get, Update, and Deactivate no longer accept or require `profileId` and resolve only from authenticated tenant context
- [x] 7.2.6.3 GREEN: Add an explicit current-profile repository lookup and adapt Get, Update, and Deactivate while preserving entitlement, RBAC, expectedVersion, and atomic audit
- [x] 7.2.6.4 REFACTOR: Consolidate tenant singleton resolution, reject impossible cardinality safely, and update all existing consumers without overloads
- [x] 7.2.6.5 Add PostgreSQL tests for singleton lookup, tenant isolation, soft deletion, recreation, stale/concurrent versions, rollback, audit atomicity, and deterministic cleanup
- [x] 7.2.6.6 Run focused/full backend, PostgreSQL, transaction, authorization, HTTP-contract, build, lint, Prisma, OpenSpec, and diff gates and publish the singleton compatibility checkpoint

### 7.2.5 Transactional Infrastructure Foundation

- [x] 7.2.5.1 RED: Add PostgreSQL integration tests proving repository and audit commit together and roll back together when audit persistence fails
- [x] 7.2.5.2 GREEN: Add minimal typed `TransactionManager` and `UnitOfWork` contracts plus a Prisma OTEC Compliance transaction adapter
- [x] 7.2.5.3 REFACTOR: Preserve existing standalone repository and `AuditLogger` compatibility without adding events, messaging, outbox, CQRS, or workers
- [x] 7.2.5.4 Document the transaction boundary and deferred concerns in an ADR
- [x] 7.2.5.5 Run build, lint, module/full tests, Prisma validation, related PostgreSQL tests, and OpenSpec validation before resuming task 7.3

- [x] 7.3 RED: Add use-case tests for accreditation CRUD plus suspend/revoke transitions
- [x] 7.4 GREEN: Implement accreditation use cases and audit behavior
  - RESOLVED: Task 7.2.5 now provides the minimal shared transaction boundary required by accreditation mutations; tasks 7.3–7.4 remain unstarted pending checkpoint approval.
- [x] 7.5 RED: Add use-case tests for certification, office, and representative CRUD/deactivation behavior
- [x] 7.6 GREEN: Implement certification, office, and representative use cases and audit behavior
  - [x] 7.5.1 RED: Add QualityCertification use-case tests for create/list/get/update/deactivate, document ownership, tenant isolation, concurrency, rollback, and approved filters
  - [x] 7.5.2 GREEN: Implement only QualityCertification backend use cases and minimal transactional dependencies; leave office and representative work pending
  - [x] 7.5.3 Verify NCh2728 readiness behavior for current, expired, missing, soft-deleted, foreign, optional, and expiring-soon certification evidence
  - [x] 7.5.4 Run QualityCertification, PostgreSQL, backend regression, build, lint, Prisma, and OpenSpec gates and publish the checkpoint
  - [x] 7.6.1 RED: Add OtecOffice use-case tests for create/list/get/update/deactivate, entitlement, tenant isolation, concurrency, rollback, and approved filters
  - [x] 7.6.2 GREEN: Implement only OtecOffice backend use cases and minimal transactional dependencies; leave legal representative work pending
  - [x] 7.6.3 Verify OTEC-OFF-001 readiness behavior for current, inactive, soft-deleted, future, expired, historical, foreign, multiple, and deactivated office evidence
  - [x] 7.6.4 Run OtecOffice, PostgreSQL, backend regression, build, lint, Prisma, and OpenSpec gates and publish the checkpoint
  - [x] 7.6.5 RED: Add LegalRepresentative use-case tests for create/list/get/update/deactivate, entitlement, document ownership, PII minimization, tenant isolation, concurrency, rollback, and approved filters
  - [x] 7.6.6 GREEN: Implement only LegalRepresentative backend use cases and minimal transactional dependencies
  - [x] 7.6.7 Verify OTEC-REP-001 readiness behavior for current, inactive, soft-deleted, future, expired, historical, foreign, multiple, and deactivated representative evidence
  - [x] 7.6.8 Run LegalRepresentative, PostgreSQL, backend regression, build, lint, Prisma, and OpenSpec gates and publish the checkpoint
  - NOTE: The user authorization called this LegalRepresentative slice "OpenSpec 7.7". The canonical plan retains it as the final part of combined tasks 7.5–7.6; canonical task 7.7 remains the unstarted resolution RED task below.
- [x] 7.7 RED: Add use-case tests for resolution CRUD, supersession, cycle prevention, and cross-tenant rejection
- [x] 7.8 GREEN: Implement resolution use cases and audit behavior
  - [x] 7.7.1 RED: Add OtecResolution use-case and domain tests for create/list/get/update/deactivate, entitlement, documents, tenant isolation, concurrency, rollback, and approved filters
  - [x] 7.7.2 RED: Add supersession tests for both expected versions, self/cross-tenant/profile/inactive/deleted/already-superseded rejection, direct/indirect/deep cycles, concurrent attempts, and five-level history
  - [x] 7.8.1 GREEN: Implement the six OtecResolution backend use cases, aggregate transitions, filters, transaction-aware repository support, and safe audit behavior
  - [x] 7.8.2 Verify OTEC-RES-001 readiness for terminal current resolutions and exclusion of inactive, soft-deleted, future, expired, foreign, superseded, and inconsistent evidence
  - [x] 7.8.3 Run OtecResolution domain/application/PostgreSQL/concurrency/rollback/readiness tests, backend regression, build, lint, Prisma, OpenSpec, and diff gates and publish the checkpoint
- [x] 7.9 RED: Add use-case tests for summary, readiness, expiration listing, and activity-preparation validation
- [x] 7.10 GREEN: Implement compliance query/evaluation use cases
  - [x] 7.9.1 RED: Add the integral readiness matrix and domain tests for all three outcomes, explainable findings, inclusive temporal boundaries, configured undated treatment, multiple records, supersession, and deterministic evaluation
  - [x] 7.9.2 RED: Add EvaluateOtecReadiness application and PostgreSQL snapshot tests for entitlement, explicit/default clock, tenant/profile non-disclosure, effective policy, soft delete, multiple records, and terminal resolutions
  - [x] 7.10.1 GREEN: Implement the pure readiness result consolidation, injected clock, tenant-scoped snapshot port, and EvaluateOtecReadiness use case without HTTP, audit writes, or Prisma imports in application/domain
  - [x] 7.10.2 Run focused/integral/PostgreSQL/backend/build/lint/Prisma/OpenSpec/diff gates, verify database restoration, update affected SENCE documentation, and publish the 7.9–7.10 readiness checkpoint
  - [x] 7.10.3 Pause summary, expiration-listing, and activity-preparation use cases until separately authorized; authorization was later granted and closure continued in 7.9.3–7.10.7
  - [x] 7.9.3 RED: Add application/domain tests for compliance summary projection, paginated deterministic expiration classification, and activity-preparation validation without duplicating readiness rules
  - [x] 7.9.4 RED: Add PostgreSQL evidence for expiration tenant isolation, soft-delete exclusion, effective settings, exceptional states, deterministic ordering, and pagination
  - [x] 7.10.4 GREEN: Implement GetOtecComplianceSummary, GetExpiringComplianceItems, ValidateOtecCanPrepareSenceActivity, and the reusable expiration classifier as read-only application/domain contracts
  - [x] 7.10.5 Formally classify findings/blocking projections as SUPERSEDED_BY EvaluateOtecReadiness, readiness history as EXCLUDED_BY_DESIGN, referential resolution queries as NOT_APPLICABLE to 7.9–7.10, and permission enforcement as DEFERRED_TO_HTTP tasks 8.5–8.6
  - [x] 7.10.6 Document all application contracts, permissions, entitlements, tenant/error/transaction/audit behavior, exclusions, and future delivery exposure without designing endpoints
  - [x] 7.10.7 Run focused, PostgreSQL, transaction/concurrency, full backend, build, lint, Prisma, OpenSpec, diff, scope, and database-restoration gates and publish the formal closure checkpoint
- [ ] 7.11 Implement transaction-aware critical audit persistence and safe correlation/rule-code metadata
  - [x] 7.11.1 RED: Add OtecProfile application and PostgreSQL tests for entitlement, permission, transactional audit, rollback, tenant isolation, and stale versions
  - [x] 7.11.2 GREEN: Move every OtecProfile command to the approved OTEC Compliance unit of work and preserve existing contracts
  - [x] 7.11.3 Verify every OTEC Compliance application operation enforces its declared entitlement feature and RBAC permission before resource access
  - [x] 7.11.4 Run authorization, transaction, PostgreSQL, full backend, build, lint, Prisma, OpenSpec, diff, and database-restoration gates and publish the hardening report
- [ ] 7.12 Verify audit/log output does not expose complete RUT values, documents, secrets, or unnecessary PII

## 8. HTTP Validation, RBAC, and Routes (TDD)

- [x] 8.10 Add temporary structured diagnostics for route-level permission decisions
  - [x] 8.10.1 Add a safe `AUTH_PERMISSION_DIAGNOSTIC` event through the existing request logger without tokens, headers, secrets, or unnecessary PII
  - [x] 8.10.2 Verify a real JWT with profile management reaches profile creation and retain the existing negative authorization regression without adding another negative test
  - [x] 8.10.3 Run focused HTTP/auth tests, build, lint, OpenSpec validation, and diff checks; document Render lookup and removal instructions

- [x] 8.9 Verify access-token permission propagation through the OTEC HTTP boundary
  - [x] 8.9.1 Inspect JWT verification, `response.locals.auth` assignments, middleware order, controller mapping, and GET/POST context construction
  - [x] 8.9.2 Add focused regression tests for real JWT verification, authentication locals, application context preservation, allowed/forbidden profile POST, shared GET/POST identity, and downstream middleware stability
  - [x] 8.9.3 Confirm the production propagation fix already present at `auth-request-context.ts` is sufficient and make no unrelated production change
  - [x] 8.9.4 Run focused auth/context/OTEC HTTP tests, full regression, build, lint, Prisma, OpenSpec, and diff gates and publish a verification report

- [x] 8.8 Correct tenant-scoped permission claims at login (TDD)
  - [x] 8.8.1 RED: Add repository and login tests for organization isolation, all authorization soft-delete boundaries, duplicate removal, argument forwarding, JWT OTEC claims, and refresh compatibility
  - [x] 8.8.2 RED: Add OTEC authorization regressions proving profile management remains forbidden without `otec_compliance.profile.manage` and proceeds with it
  - [x] 8.8.3 GREEN: Change the auth repository contract and Prisma query to resolve active permissions by `userId` plus `organizationId`, then pass both values from login
  - [x] 8.8.4 REFACTOR: Keep JWT creation and OTEC authorization policy unchanged; verify strict typing and no cross-tenant claim path
  - [x] 8.8.5 Run focused auth, Prisma repository, OTEC authorization, full regression, typecheck/build, lint, and Prisma validation gates and publish a verification report

- [x] 8.1 RED: Add validator tests for each request, filter set, mass-assigned tenant field, date range, expected version, and transition payload
  - [x] 8.1.1 Produce the case-to-exposure matrix and classify all 35 existing use cases plus the non-applicable activation candidate before DTO design
  - [x] 8.1.2 RED: Add transport contract tests for strict bodies, ISO dates, enums, pagination, filters, If-Match, ETag, response presentation, errors, and non-disclosure
- [x] 8.2 GREEN: Implement Zod validators and repository-standard validation responses
  - [x] 8.2.1 GREEN: Implement design-only Zod request/query schemas, concurrency helpers, presenters, and pure HTTP error mapping without controllers or routes
  - [x] 8.2.2 REFACTOR: Consolidate shared HTTP primitives while keeping transport DTOs independent of Prisma, application DTOs, and domain entities
- [x] 8.3 RED: Add HTTP tests for 401, 403, disabled module, 404/non-disclosure, 409, invalid payload, pagination, and success paths
  - [x] 8.3.1 Publish the productive endpoint inventory and classify exposed, internal-only, deferred, blocked, and not-applicable operations
  - [x] 8.3.2 RED: Add thin-controller tests for request/input/context/output/status/header mapping without repository or domain access
  - [x] 8.3.3 RED: Add real-router tests for authentication, strict transport validation, tenant non-disclosure, permission/entitlement independence, pagination, and safe errors
  - [x] 8.3.4 RED: Add If-Match/ETag tests for required, malformed, current, stale, and concurrent versioned mutations
- [x] 8.4 GREEN: Implement typed conflict/module errors, controllers, route composition, and all `/api/v1/otec-compliance/*` endpoints
  - [x] 8.4.1 GREEN: Complete the approved strict request/query/parameter schemas and authenticated UseCaseContext mapping
  - [x] 8.4.2 GREEN: Implement resource-specific thin controllers and shared transport adapters without Prisma or business rules
  - [x] 8.4.3 GREEN: Compose the existing application use cases and register only approved productive routes under `/api/v1/otec-compliance`
  - [x] 8.4.4 REFACTOR: Consolidate response, error, pagination, and concurrency behavior while preserving resource boundaries
  - [x] 8.4.5 Run PostgreSQL-backed HTTP transport coverage, verify deterministic cleanup, and publish the controller/routes checkpoint
  - [x] 8.4.6 RED/GREEN: Expose the already-contracted `ETag` response header through CORS after browser integration proves it is otherwise unreadable; add regression coverage without changing OTEC routes or contracts
- [x] 8.5 Add and seed the approved `otec_compliance.*` permissions without relying on frontend visibility
  - [x] 8.5.1 RED: Add application authorization-policy and idempotent permission-seed tests covering all 36 OTEC Compliance operations
  - [x] 8.5.2 GREEN: Add the approved `otec_compliance.*` permissions to the existing idempotent bootstrap and assign them only to the existing demo administrator role
- [x] 8.6 Verify access order: tenant → entitlement → feature → permission → domain rule
  - [x] 8.6.1 GREEN: Implement a small transport-independent OTEC application authorization policy using UseCaseContext permissions and the existing entitlement evaluator
  - [x] 8.6.2 Verify read/manage separation, incomplete contexts, cross-tenant non-disclosure, and entitlement/permission independence without adding HTTP behavior
- [x] 8.7 Verify rate-limit and idempotency behavior against existing infrastructure and document any Phase 2 debt
  - [x] 8.7.1 Inventory every productive create endpoint, uniqueness protection, retry ambiguity, and audit duplication risk
  - [x] 8.7.2 Record `NOT_REQUIRED` or `REQUIRED_BEFORE_EXTERNAL_CONSUMERS` without implementing storage, headers, or middleware

## 9. Frontend Services and State Handling (TDD)

- [ ] 9.1 RED: Add service/hook tests for summary, antecedent lists/mutations, expirations, module state, forbidden state, and conflicts
  - [x] 9.1.1 Inventory the current frontend routing, layout, authentication, API client, TanStack Query, forms, validation, feedback, permissions, entitlement discovery, and browser-test infrastructure for the authorized OtecProfile slice
  - [x] 9.1.2 RED: Add OtecProfile-only contract, schema, API mapping, ETag, retry-policy, query-key, hook, and tenant-identity exclusion tests
  - [x] 9.1.3 RED: Add Accreditation and Quality Certification contract, schema, service, ETag, If-Match, retry-policy, filter, pagination, transition, query-key, and tenant/actor exclusion tests
  - [x] 9.1.4 RED: Add Office and Legal Representative contract, profile-context resolver, schema, service, ETag, If-Match, filter, pagination, transition, privacy, query-key, and tenant/actor exclusion tests
  - [x] 9.1.5 RED: Add Resolution and Readiness dashboard service, schema, query-key, concurrency, supersession, summary, evaluation, expiration, RBAC, entitlement, and presentation tests
- [ ] 9.2 GREEN: Add typed resources, API services, query keys, and TanStack Query hooks
  - [x] 9.2.1 GREEN: Add only the OtecProfile typed resource, shared-client service, stable query key, and create/get/update/deactivate hooks with response-bound ETag state
  - [x] 9.2.2 GREEN: Add typed Accreditation and Quality Certification resources, shared-client services, stable list/detail query keys, and narrowly invalidating TanStack Query hooks
  - [x] 9.2.3 GREEN: Add typed Office and Legal Representative resources, shared profile-context resolver, services, stable list/detail query keys, and narrowly invalidating hooks
  - [x] 9.2.4 GREEN: Add typed Resolution and backend-authoritative Readiness services/hooks with stable narrow query keys and shared authenticated Profile context
- [ ] 9.3 Implement safe 409 draft preservation/reload behavior and explicit module-unavailable states
  - [x] 9.3.1 Implement only the OtecProfile 409 conflict flow: preserve safe draft data, invalidate/refetch the singleton, and never retry the mutation automatically
  - [x] 9.3.2 Implement Accreditation and Quality Certification 409 conflict flows that preserve safe drafts, refetch current detail, and never retry mutations automatically
  - [x] 9.3.3 Implement Office and Legal Representative 409 conflict flows that preserve safe drafts, refetch current detail, and never retry mutations automatically
  - [x] 9.3.4 Implement Resolution 409 draft preservation/refetch behavior and explicit backend-denial state for Readiness without mutation retries
- [ ] 9.4 Verify no frontend request accepts or overrides an arbitrary tenant identifier
  - [x] 9.4.1 Prove OtecProfile routes, forms, service inputs, request bodies, and query keys contain no `profileId`, `organizationId`, `tenantId`, or `actorId`
  - [x] 9.4.2 Prove Accreditation and Quality Certification requests never accept `organizationId`, `tenantId`, or `actorId`; allow only the contract-required active `otecProfileId` resolved internally from the singleton profile
  - [x] 9.4.3 Prove Office and Legal Representative requests never accept `organizationId`, `tenantId`, or `actorId`; resolve contract-required `otecProfileId` only through authenticated singleton query state
  - [x] 9.4.4 Prove Resolution and Readiness requests never accept `organizationId`, `tenantId`, or `actorId`; resolve the contract-required profile only from authenticated singleton state

## 10. Frontend OTEC Compliance Workspace (TDD)

- [ ] 10.1 RED: Add component tests for READY, READY_WITH_WARNINGS, NOT_READY, empty, forbidden, conflict, expiration, suspended, and revoked states
  - [x] 10.1.1 RED: Add OtecProfile-only component and integration tests for loading, existing, empty, session-expired, forbidden, module-unavailable, network, validation, conflict, inactive, and unexpected-error states
  - [x] 10.1.2 RED: Add Accreditation and Quality Certification component/integration tests for loading, empty, list/detail, filters, pagination, create, update, transitions, conflicts, validation, forbidden, and module-unavailable states
  - [x] 10.1.3 RED: Add Office and Legal Representative component/integration tests for loading, profile dependency, empty, list/detail, filters, pagination, create, update, deactivation, conflicts, validation, forbidden, and module-unavailable states
- [ ] 10.2 RED: Add form tests for profile and every regulatory record type, including invalid dates and RUT validation
  - [x] 10.2.1 RED: Add OtecProfile create/edit form tests for approved fields, validation, dirty-state submit protection, safe draft retention, and forbidden identity fields
  - [x] 10.2.2 RED: Add Accreditation and Quality Certification create/edit form tests for their distinct approved fields, date ranges, dirty-state submit protection, and safe draft retention
  - [x] 10.2.3 RED: Add Office and Legal Representative create/edit form tests for distinct approved fields, dates, RUT/email validation, dirty-state submit protection, safe draft retention, and PII minimization
- [ ] 10.3 GREEN: Implement Settings → OTEC Compliance navigation and the compliance summary dashboard
  - [x] 10.3.1 GREEN: Add only the authenticated `/otec-compliance/profile` route and responsive navigation entry; do not add the compliance summary dashboard
  - [x] 10.3.2 GREEN: Add only responsive OTEC secondary navigation and authenticated Accreditation and Quality Certification routes; do not add summary or other regulatory resources
  - [x] 10.3.3 GREEN: Add only authenticated Office and Legal Representative routes to the responsive OTEC secondary navigation; do not add Resolutions or Readiness
  - [x] 10.3.4 GREEN: Add authenticated Resolution and executive Readiness routes to the OTEC secondary navigation and no other module surface
- [ ] 10.4 GREEN: Implement connected profile, accreditation, certification, office, representative, resolution, and expiration views/forms
  - [x] 10.4.1 GREEN: Implement only the connected OtecProfile singleton view and create/edit forms using the approved backend contract
  - [x] 10.4.2 GREEN: Implement only connected Accreditation and Quality Certification list/detail/create/edit views with approved filters and pagination
  - [x] 10.4.3 GREEN: Implement only connected Office and Legal Representative list/detail/create/edit views with approved filters, pagination, and minimal personal-data exposure
  - [x] 10.4.4 GREEN: Implement connected Resolution workflows and the backend-authoritative executive Readiness dashboard, including exceptional expiration evidence
- [ ] 10.5 Add confirmation flows for suspension, revocation, deactivation, and supersession
  - [x] 10.5.1 Add only the accessible OtecProfile deactivation confirmation and current-ETag mutation flow
  - [x] 10.5.2 Add accessible current-ETag confirmations only for Accreditation suspension/revocation and Quality Certification deactivation
  - [x] 10.5.3 Add accessible current-ETag deactivation confirmations only for Office and Legal Representative
  - [x] 10.5.4 Add accessible current-ETag Resolution deactivation and dual-ETag supersession confirmations
- [ ] 10.6 Verify responsive layout, keyboard operation, labels, loading, error, empty, forbidden, and conflict accessibility
  - [x] 10.6.1 Verify the OtecProfile slice at mobile and desktop sizes with keyboard, focus, labels, described errors, modal focus management, and live feedback
  - [x] 10.6.2 Verify Accreditation and Quality Certification at mobile and desktop sizes with keyboard, focus, labels, described errors, confirmation focus management, and live feedback
  - [x] 10.6.3 Verify Office and Legal Representative at mobile and desktop sizes with keyboard, focus, labels, described errors, confirmation focus management, and live feedback
  - [x] 10.6.4 Verify Resolution and Readiness desktop/mobile accessibility, RBAC, entitlement, concurrency, executive indicators, and backend-only rule presentation
- [ ] 10.7 Verify the UI never implies official SENCE, RUDO, OTIC, or LCE integration or validation
  - [x] 10.7.1 Verify the OtecProfile route and documentation describe internal configuration only and contain no official-system validation claim
  - [x] 10.7.2 Verify Accreditation and Quality Certification routes and documentation describe internal evidence only and contain no official-system validation claim
  - [x] 10.7.3 Verify Office and Legal Representative routes, fixtures, logs, and documentation minimize PII, describe internal evidence only, and contain no official-system validation claim

## 11. Demo Seed and Backward Compatibility

- [ ] 11.1 Add clearly fictitious, idempotent OTEC profile, accreditation, NCh2728, office, representative, resolution, and upcoming-expiration seed data
- [ ] 11.2 Enable `OTEC_COMPLIANCE` only for the intended fictitious demo tenant; leave existing tenants unavailable by default
- [ ] 11.3 Verify existing SENCE declaration, certificate, training, auth, and demo flows remain unchanged

## 12. OpenAPI and Contract Verification

- [x] 12.1 Add OTEC Compliance tags, schemas, examples, permission metadata, pagination, and the stable 400/401/403/404/409/500 policy; explicitly exclude 412/422
  - [x] 12.1.1 Publish a design-only OTEC Compliance OpenAPI contract with explicit implementation status, permissions, entitlements, pagination, filters, concurrency, and errors
  - [x] 12.1.2 Resolve the 422/412 contradiction by preserving 400 for non-conflict validation and 409 for all optimistic/state conflicts
  - [x] 12.1.3 RED: Add contract tests for operation-specific request/response schemas, valid examples, strict additional properties, identity exclusion, and stable error status policy
  - [x] 12.1.4 GREEN/REFACTOR: Replace generic OpenAPI bodies/responses with specific reusable components and validated fictitious examples
  - [x] 12.1.5 Run OpenAPI, HTTP, E2E, backend, build, lint, Prisma, OpenSpec, diff, and PostgreSQL cleanup gates and publish the contractual-hardening checkpoint
- [x] 12.2 Mark every operation implemented and add internal-only/no-official-integration disclaimers
- [x] 12.3 Add or run OpenAPI syntax and route-drift validation and resolve every mismatch
  - [x] 12.3.1 Add contract-level OpenAPI assertions without claiming route parity before routes exist
  - [x] 12.3.2 RED: Add mapper, productive HTTP PostgreSQL E2E, runtime/OpenAPI, and frontend rejection tests proving readiness findings expose only `code`
  - [x] 12.3.3 GREEN: Map internal `ruleCode` to public `code` at the HTTP boundary and remove the frontend compatibility fallback
  - [x] 12.3.4 REFACTOR: Align fixtures, Readiness documentation, contract/runtime traceability, and the Enterprise RC1 report; rerun every release gate and deterministic cleanup

## 13. Review and Update Existing Unit Tests (MANDATORY)

- [x] 13.1 Review all existing backend tests affected by errors, audit context, route composition, Prisma schema, seed, and permissions
- [x] 13.2 Review all existing frontend tests affected by navigation, API errors, types, settings, and shared components
- [x] 13.3 Update only tests whose documented behavior intentionally changes and retain regression assertions for unchanged modules

## 14. Run Unit Tests and Verify Database State (MANDATORY - AGENT MUST EXECUTE)

- [ ] 14.1 Prepare a disposable test database and record pre-test counts/checksums for all impacted tables
- [ ] 14.2 Run targeted domain, use-case, repository, validator, HTTP, authorization, audit, concurrency, and frontend tests
- [ ] 14.3 Run the complete backend and frontend unit/component suites and record totals, duration, failures, skips, and retries
- [ ] 14.4 Recheck database counts/checksums, restore unintended mutations, and confirm no state remains
- [ ] 14.5 Create `openspec/changes/add-otec-compliance-foundation/reports/2026-07-16-step-14-unit-test-and-db-verification.md`
- [ ] 14.6 Mark this step complete only after tests pass, database state is verified/restored, and the report exists

## 15. Manual Endpoint Testing with curl (MANDATORY - AGENT MUST EXECUTE)

- [ ] 15.1 Start the backend against a disposable database and capture the pre-test database baseline
- [ ] 15.2 Execute curl coverage for every GET/list/summary/readiness/expiration endpoint and verify status/body contracts
- [ ] 15.3 Execute every POST creation and transition endpoint, verify persistence/audit, and remove or restore created records
- [ ] 15.4 Execute every PATCH/DELETE/deactivation endpoint, verify expected versions, and restore original state
- [ ] 15.5 Execute 401, 403, disabled module, invalid payload, cross-tenant, not-found, and stale-version cases
- [ ] 15.6 Verify database state equals the pre-test baseline after cleanup
- [ ] 15.7 Create `openspec/changes/add-otec-compliance-foundation/reports/2026-07-16-step-15-manual-endpoint-testing.md` with commands and sanitized responses
- [ ] 15.8 Mark this step complete only after the agent executes all curl tests and restoration succeeds

## 16. Frontend E2E Testing with Playwright MCP (MANDATORY - AGENT MUST EXECUTE)

- [ ] 16.1 Confirm Playwright MCP availability and start backend/frontend against known disposable data
- [ ] 16.2 Execute profile setup and all regulatory-record user workflows through the browser
- [ ] 16.3 Verify READY, warning, blocking, empty, forbidden, conflict, and destructive-confirmation states
- [ ] 16.4 Verify persisted UI results against the database/API and test validation/error recovery
- [ ] 16.5 Clean all browser-created data, restore the database baseline, and close browser sessions
- [ ] 16.6 Create `openspec/changes/add-otec-compliance-foundation/reports/2026-07-16-step-16-frontend-e2e.md`
- [ ] 16.7 Mark this step complete only after agent-executed E2E passes, or record tooling unavailability without claiming execution

## 17. Full Quality and Security Gate

- [ ] 17.1 Run backend build, lint, full tests, Prisma validation, migration validation, and applicable database E2E tests
- [x] 17.2 Run frontend lint, full tests, and production build
- [ ] 17.3 Run available coverage tooling and create a coverage report, or document that infrastructure remains unavailable
- [ ] 17.4 Scan tracked changes for secrets, unnecessary PII, cross-tenant query gaps, mass assignment, unsafe logs, and unrelated modifications
- [ ] 17.5 Verify no historical migration, secret, infrastructure configuration, stable public contract, or out-of-scope module changed without documented justification

## 18. Update Technical Documentation (MANDATORY)

- [ ] 18.1 Update `docs/api-spec.yml`, `docs/rbac-matrix.md`, `docs/data-model.md`, and relevant development/deployment guidance
- [ ] 18.2 Create `docs/sence/OTEC_COMPLIANCE_RBAC.md` and verify it matches backend permissions
- [ ] 18.3 Update the ten Phase 0 artifacts with final implementation decisions and traceability
- [ ] 18.4 Create `docs/sence/PHASE_1_IMPLEMENTATION_REPORT.md` with scope, files, decisions, tests, commands, coverage, limitations, risks, debt, non-goals, and Phase 2 recommendation
- [ ] 18.5 Verify all documentation is in English, evidence-based, and contains no official-integration claims

## 19. Final Acceptance and Handoff

- [ ] 19.1 Demonstrate answers and rule evidence for all 15 Phase 1 acceptance questions
- [ ] 19.2 Verify only READY, READY_WITH_WARNINGS, and NOT_READY readiness outcomes are returned
- [ ] 19.3 Verify prohibited official-accreditation/integration language is absent from code, UI, API, seed, tests, and documentation
- [ ] 19.4 Review the complete diff, migration, symlinks, reports, and remaining risks without committing, tagging, pushing, or deploying
