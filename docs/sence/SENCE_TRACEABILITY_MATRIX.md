# OTEC Compliance Traceability Matrix

## Purpose

This matrix links Phase 1 acceptance questions and rules to OpenSpec requirements, planned implementation, and required verification. Implementation/report links must be completed during `/opsx:apply`.

| Acceptance / rule | Specification | Planned implementation | Required verification | Status |
|---|---|---|---|---|
| Organization is configured as OTEC / OTEC-FOUND-001 | `otec-regulatory-records`: OTEC profile eligibility; `otec-readiness` | Organization read port; CreateOtecProfile; evaluator | Entity/use-case/HTTP tests for OTEC vs non-OTEC | Specified |
| Active profile exists / OTEC-FOUND-002 | `otec-regulatory-records`: profile eligibility and tenant singleton | OtecProfile + partial unique index + `findCurrentByOrganizationId` | Duplicate/current/historical/recreation/tenant/concurrency/rollback tests | Backend singleton and HTTP implemented |
| Current accreditation exists / OTEC-ACC-001 | `otec-readiness`: internal evaluation | Accreditation entity/repository/evaluator/snapshot adapter | Integral current/future/expired/suspended/revoked/multiple/tenant tests | Implemented; functional validation pending |
| Current NCh2728 when required / OTEC-QUAL-001 | `otec-readiness`: configurable rules | Effective settings + QualityCertification + evaluator | Required/optional/current/expired/missing/warning tests | Implemented; functional validation pending |
| Active qualifying office / OTEC-OFF-001 | `otec-readiness` | OtecOffice + effective configured qualifying types | Active/inactive/type/tenant/soft-delete tests | Implemented; qualifying types pending |
| Current legal representative / OTEC-REP-001 | `otec-readiness` | LegalRepresentative + effective snapshot | Current/expired/missing/inactive/multiple tests | Implemented; functional validation pending |
| Required resolutions / OTEC-RES-001 | `otec-readiness`; `otec-regulatory-records` | Settings + OtecResolution + terminal-chain projection | Required/expired/superseded/terminal/cycle/cross-tenant tests | Implemented; required types pending |
| Expired and upcoming items | `otec-readiness`: expiration queries | Expiration classifier and GetExpiringComplianceItems | Boundary/custom/undated/tenant/soft-delete/pagination tests | Backend implemented; delivery pending |
| Missing items and blockers | `otec-readiness`: evidence-rich result | OtecReadinessEvaluator + EvaluateOtecReadiness | 18 integral scenarios, three outcomes, explainability, score precedence | Implemented for readiness query |
| Can begin internal SENCE preparation | `otec-readiness`: activity preparation gate | ValidateOtecCanPrepareSenceActivity | Permit ready/warnings; deny blocked | Backend implemented; delivery pending |
| Audit actor and change | `otec-compliance-traceability`: sensitive audit | Transaction-aware AuditLogger/context | Audit existence/content/failure tests | Specified |
| Tenant isolation / OTEC-TENANT-001 | All capability specs | Repository predicates, authenticated context, snapshot port | Repository/application/PostgreSQL/HTTP cross-tenant matrix | Implemented through backend HTTP |
| Real concurrency / OTEC-VERSION-001 | `otec-regulatory-records`: optimistic concurrency | Expected-version repository predicate + ConflictError | Concurrent/stale version integration and HTTP 409 | Specified |
| Document ownership / OTEC-DOC-001 | `otec-regulatory-records`: document ownership | TenantDocumentOwnershipPort | Same/foreign/deleted/omitted document tests | Specified |
| Date integrity / OTEC-DATE-001 | `otec-regulatory-records` | DateRange/value validation | Ordered/equal/reversed/undated tests | Specified |
| Module enabled for tenant | `otec-module-entitlement` | Entitlement model/service, application policy, HTTP defense in depth | Enabled/disabled/suspended/expired/restricted and HTTP tests | Backend and HTTP implemented |
| Backend permissions | `otec-compliance-api` | Application enforcement + HTTP guards + eight idempotent `otec_compliance.*` seeds | Read/manage separation, missing permission and PostgreSQL seed tests | Backend and HTTP implemented |
| Connected frontend | `otec-compliance-workspace` | Services/hooks/pages/forms | Component tests and Playwright workflow | Specified |
| OpenAPI truth and disclaimers | `otec-compliance-traceability` | `OTEC_HTTP_CONTRACTS.openapi.yml` | Syntax/route drift and content review | Productive contract implemented |

The OTEC transport contract now documents the productive routes in `OTEC_HTTP_CONTRACTS.openapi.yml`; activity validation remains internal-only and is intentionally absent.
| No official integration claims | API/workspace/traceability specs | Copy/constants/docs review | Repository search and human review | Specified |

The compliance summary projection is implemented by `GetOtecComplianceSummaryUseCase`. Standalone findings and blocking-item queries are `SUPERSEDED_BY` the consolidated `EvaluateOtecReadinessUseCase` result. Readiness history persistence is `EXCLUDED_BY_DESIGN` in favor of explicit historical `evaluationDate`. Permission enforcement is `DEFERRED_TO_HTTP` tasks 8.5–8.6. The complete decision and future-delivery matrix is in `OTEC_APPLICATION_USE_CASES.md`.

## Artifact Traceability

| Artifact | Purpose |
|---|---|
| `openspec/changes/add-otec-compliance-foundation/proposal.md` | Scope and capability contract |
| `openspec/changes/add-otec-compliance-foundation/design.md` | Architecture decisions and migration strategy |
| `openspec/changes/add-otec-compliance-foundation/specs/*/spec.md` | Testable normative behavior |
| `openspec/changes/add-otec-compliance-foundation/tasks.md` | Ordered TDD and verification execution |
| `docs/sence/SENCE_REGULATORY_RULES.md` | Rule metadata and validation status |
| `docs/sence/SENCE_DATA_DICTIONARY.md` | Proposed data meaning and integrity |
| `docs/sence/OTEC_COMPLIANCE_ARCHITECTURE.md` | Bounded-context and dependency map |
| `docs/sence/OTEC_APPLICATION_USE_CASES.md` | Application contracts, decisions, exclusions, and future delivery eligibility |
| `docs/sence/PHASE_1_IMPLEMENTATION_REPORT.md` | Final evidence after implementation |

## Completion Rule

An acceptance item remains incomplete until its implementation, automated tests, applicable manual verification, and final report evidence are linked. Passing a numerical score cannot substitute for a failed blocking rule or missing test evidence.
