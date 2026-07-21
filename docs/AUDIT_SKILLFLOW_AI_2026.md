# SkillFlow AI 2026 Product Maturity Audit

**Audit date:** July 16, 2026  
**Scope:** Repository architecture, implemented behavior, data model, HTTP surface, frontend, tests, documentation, delivery assets, and OTEC/SENCE operational readiness  
**Method:** Static repository inspection plus execution of the repository's non-mutating quality gates. No application code was changed.  
**Evidence rule:** Product claims are based only on repository evidence. Current official Chilean sources are used only as an explicitly identified benchmark for the OTEC/SENCE gap assessment.

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Method, Scope, and Scoring](#2-method-scope-and-scoring)
3. [Repository Inventory](#3-repository-inventory)
4. [Module Inventory and Scores](#4-module-inventory-and-scores)
5. [Detailed Functional Audit](#5-detailed-functional-audit)
6. [Technical and Architectural Audit](#6-technical-and-architectural-audit)
7. [Detailed SENCE and OTEC Audit](#7-detailed-sence-and-otec-audit)
8. [Gap Analysis](#8-gap-analysis)
9. [Roadmap](#9-roadmap)
10. [Maturity Matrix](#10-maturity-matrix)
11. [Risks](#11-risks)
12. [Recommendations](#12-recommendations)
13. [Verification Record](#13-verification-record)

## 1. Executive Summary

SkillFlow AI is a working, modular training-management demo/MVP, not an enterprise product. The repository contains a real TypeScript/Express/Prisma backend, a connected Next.js frontend, 30 Prisma models, 13 registered backend routers including authentication, 21 built frontend application routes, and a coherent commercial demonstration flow from organization registration through SENCE declaration preparation. The strongest implemented areas are evaluations, enrollments, attendance, certificates, authentication, and the modular backend structure.

The current product is best classified as **MVP overall**. It can demonstrate end-to-end training operations with real persistence and guarded APIs, but production and enterprise readiness are blocked by missing operational modules, shallow end-to-end assurance, and infrastructure limitations. Provider management, document management, notification delivery, reporting APIs, audit-event querying, finance, and AI are data-model or OpenAPI concepts without active runtime modules. RBAC enforcement exists, but role administration does not. Audit writes exist across important actions, but users cannot query the audit trail. The frontend covers the commercial core but does not expose organizations, users, roles, instructors, providers, documents, notifications, or audit administration.

The SENCE area is accurately described in the repository as a **compliance preparation foundation and manual stub**, not an integration. It supports declaration records, a simple status workflow, logical evidence summaries, document associations, validation, and audit writes. It does not communicate, rectify, annul, pre-liquidate, or liquidate an activity with SENCE or an OTIC; it has no Libro de Clases Electrónico (LCE), connectivity registry, electronic signature, official certificate, invoice/payment evidence, declaration-jurada flow, OTEC accreditation register, NCh2728 validity control, resolution management, or real SENCE/OTIC connector. Its SENCE maturity is therefore **Concept**, despite having a technically coherent local workflow.

### Headline scores

| Dimension | Score | Interpretation |
|---|---:|---|
| Functional completeness | 55% | Commercial core exists; enterprise and OTEC operations are incomplete. |
| Technical quality | 67% | Strong typing and modular boundaries; important distributed-system controls are absent. |
| Architecture | 72% | Consistent Clean Architecture/DDD-lite structure; unused event foundation and direct composition limit maturity. |
| Testing | 54% | 129 passing unit/component tests; no measured coverage and limited executed E2E evidence in this audit. |
| Security | 57% | JWT, RBAC, Helmet, CORS, validation, and rate limits exist; browser token storage and in-memory controls are production risks. |
| Scalability | 42% | Stateless API shape helps, but in-process rate limits, no cache/queue, and concurrency gaps prevent reliable horizontal scale. |
| Documentation | 64% | OpenAPI and operational guides are extensive, but some content is stale or roadmap-heavy. |
| UX | 63% | Coherent Spanish commercial UI for the core flow; many administration and exception workflows are absent. |
| Commercial readiness | 58% | Suitable for a guided demo or controlled pilot, not an unsupported production sale. |
| Enterprise readiness | 35% | Missing SSO, operational observability, resilient integrations, governance, DR, and complete audit controls. |

### Critical conclusion

The repository supports a credible **guided commercial demo and controlled MVP pilot**. It does not support the claim of an enterprise OTEC/SENCE operating platform. The safest market position is “training-management MVP with SENCE evidence-preparation workflow,” not “SENCE-integrated OTEC ERP.”

## 2. Method, Scope, and Scoring

### 2.1 Evidence inspected

- Source structure under `src/`, `frontend/`, and `prisma/`.
- All backend module file inventories, route registration, use-case names, entities, repository interfaces, Prisma repositories, validators, controllers, and module tests.
- Prisma schema and four migrations.
- Frontend routes, features, hooks, service clients, stores, and component tests.
- Root and frontend package manifests, TypeScript, ESLint, Vitest, Docker, Render, and GitHub Actions configuration.
- OpenAPI, data model, RBAC matrix, deployment guides, demo guides, commercial documentation, and repository analysis documentation.
- Cross-cutting authentication, authorization, tenancy, audit, rate limiting, logging, validation, error handling, soft-delete, and versioning behavior.

Generated `dist/`, `.next/`, and dependency directories were excluded from source-size and design assessments.

### 2.2 Scoring model

Module progress is an evidence-based completeness score against the objective implied by the implemented module and the audit request:

- **0–19%:** absent or schema-only concept.
- **20–39%:** concept with isolated artifacts or stubs.
- **40–59%:** MVP slice with substantial operational gaps.
- **60–79%:** beta-quality breadth, still missing production controls.
- **80–94%:** production-capable within a bounded scope.
- **95–100%:** enterprise controls and operational proof exist.

The score is not a code-quality percentage and is not test coverage. “Exists,” “Partial,” and “Does not exist” refer to usable runtime behavior, not merely a Prisma model or an OpenAPI path.

### 2.3 Limits

- No claim is made about deployed uptime, real customer use, penetration testing, load testing, backup restoration, or production incidents because no evidence exists in the repository.
- Unit and frontend tests were executed. Database E2E tests were inspected but not run because they require a configured disposable PostgreSQL test database and apply migrations.
- No coverage provider or coverage thresholds are configured; therefore coverage cannot be reported as a percentage.
- Official SENCE sources are a current operational benchmark, not evidence that the product implements those requirements.

## 3. Repository Inventory

### 3.1 Technology and size

| Area | Observed inventory |
|---|---|
| Backend | Node.js 20+, TypeScript strict mode, Express 4, Prisma 6, PostgreSQL, Zod, JWT, bcrypt, Pino |
| Frontend | Next.js 16, React 18, TypeScript, TanStack Query/Table, Zustand, React Hook Form, Zod, Recharts, Tailwind, Radix UI |
| Testing | Vitest, Supertest, Testing Library, jsdom |
| Backend source | 286 TypeScript files; approximately 19,804 lines including tests |
| Frontend source | 116 TS/TSX/CSS files in application areas; approximately 6,377 lines including tests |
| Prisma | 30 models, 21 enums, 4 migrations, demo seed |
| Backend modules | Auth, Organizations, Users, Employees, Courses, Training Plans, Instructors, Training Sessions, Enrollments, Attendance, Evaluations, Certificates, SENCE |
| Frontend product routes | 21 routes built successfully, plus the framework not-found route |
| OpenAPI | OpenAPI 3.1 contract with implemented and explicitly roadmap-marked paths |
| Delivery | Backend Dockerfile, local PostgreSQL Compose, Render backend descriptor, GitHub Actions CI |

### 3.2 Backend architecture inventory

The backend uses a consistent module template:

```text
src/modules/<module>/
├── application/
│   ├── dto/
│   ├── mappers/
│   └── use-cases/
├── domain/
│   ├── entities/
│   ├── repositories/
│   └── services/          # where needed
├── infrastructure/prisma/
├── interfaces/http/
│   ├── controllers/
│   ├── routes/
│   └── validators/
└── <module>.test.ts
```

Shared foundations include entity/value-object/aggregate classes, IDs, email and Chilean RUT value objects, pagination, use-case context, error types, audit interfaces, Prisma audit persistence, HTTP validation, async error handling, request-value parsing, global middleware, and health/system endpoints.

### 3.3 Data model inventory

| Domain | Prisma models | Runtime status |
|---|---|---|
| Tenant and identity | Organization, User, PasswordResetToken, Role, Permission, UserRole, RolePermission | Organizations/users/auth active; role administration absent. |
| Workforce | Employee | Active. |
| Supply and trainers | Provider, Instructor | Instructor active; provider has no module/API. |
| Catalog | Course, CourseModule, Competency, CourseCompetency | Course active; modules and competencies have no runtime module/API. |
| Planning | TrainingPlan, TrainingPlanItem | Active. |
| Execution | TrainingSession, Enrollment, AttendanceRecord | Active. |
| Assessment | Evaluation, EvaluationQuestion, EvaluationResponse, EvaluationAnswer | Active. |
| Certification | Certificate | Active; document generation is metadata-only. |
| SENCE | SenceDeclaration, SenceDocument | Active local preparation workflow. |
| Cross-cutting concepts | Document, Notification, ReportSnapshot, AuditEvent | Audit writes active; other runtime modules and audit query API absent. |

Most operational records include `organizationId`, `deletedAt`, and `version`. Composite tenant relations are used broadly. The design is materially multi-tenant at the data and repository levels, although it does not constitute database-level tenant isolation.

### 3.4 API inventory

The application registers 100 HTTP route declarations, including health and demo bootstrap. The OpenAPI implementation report lists the active business surface and explicitly identifies eight roadmap operations:

- `GET /roles`
- `GET|POST /providers`
- `POST /documents`
- `GET /reports/dashboard`
- `GET /reports/training-compliance`
- `POST /ai/recommendations/training-gaps`
- `GET /audit/events`

There is no observed API implementation for finance, notifications, course modules, competencies, electronic signatures, file storage, or external SENCE/OTIC services.

### 3.5 Frontend inventory

Connected application screens exist for dashboard, employees, courses, training plans, training sessions, enrollments, attendance, evaluations, certificates, SENCE, settings, authentication, and password reset. Public commercial pages exist for home, about, use cases, demo, pricing, and roadmap.

Important gaps:

- No organization, user, role, permission, instructor, provider, document, notification, or audit administration screen.
- Training plans are read-only in the frontend service layer.
- Settings displays static demo rows rather than connected administration.
- Dashboard metrics are assembled client-side from eight list endpoints with `pageSize: 100`, not from analytical APIs.
- Certificate preview explicitly uses a visual placeholder rather than a real QR code.
- SENCE checklist selects the first declaration/session rather than providing a complete case workspace.

### 3.6 Tests and delivery inventory

| Gate | Observed result |
|---|---|
| Backend TypeScript build | Passed |
| Backend unit/module tests | 14 files, 113 tests passed |
| Prisma validation | Passed |
| Frontend lint | Passed |
| Frontend tests | 8 files, 16 tests passed |
| Frontend production build | Passed outside the restricted audit sandbox; 22 framework routes generated including not-found |
| Backend lint | Passed |
| Database E2E | Three suites exist; not executed in this audit |
| Coverage | No provider, report, or threshold configured |

CI runs backend build, lint, unit tests, database E2E tests, and Prisma validation. It runs frontend lint and build, but **does not run frontend tests**. There is no dependency audit, secret scan, SAST, image scan, migration drift check, coverage gate, or deployment promotion workflow.

## 4. Module Inventory and Scores

| Module | Status | Progress | Maturity | Backend/API | Frontend | Tests | OpenAPI |
|---|---|---:|---|---|---|---|---|
| Core/System | Exists | 72% | Beta | Health, configuration, errors, validation, pagination, demo bootstrap | Shared shell and feedback system | Unit/E2E files | Health documented |
| Authentication | Exists | 78% | Beta | Register, login, current user, refresh, logout, forgot/reset password | Login and reset screens | 11 backend + frontend login | Documented |
| Organizations | Partial | 62% | MVP | CRUD/deactivate | No management screen | 2 | Documented |
| RBAC | Partial | 58% | MVP | JWT permission enforcement and seeded roles | No role/permission administration | Security tests | Roles path is roadmap |
| Users | Partial | 65% | MVP | CRUD, activate/deactivate | No management screen | 2 | Documented |
| Employees | Exists | 74% | Beta | CRUD/list with tenant filtering | List/create/edit | 4 + form tests | Documented |
| Courses | Partial | 69% | MVP | CRUD/archive, SENCE code and modality | List/create/edit/charts | 5 + form tests | Documented |
| Course Modules/Competencies | Partial | 20% | Concept | Data models only | None | None | Schemas/concepts only |
| Training Plans | Partial | 67% | MVP | CRUD, items, approval/rejection | List/summary only | 6 | Documented |
| Instructors | Partial | 58% | MVP | CRUD/list | None | 4 | Documented |
| Providers | Partial | 18% | Concept | Data model only | None | None | Roadmap |
| Training Sessions | Exists | 72% | Beta | CRUD/list/publish | List/create/edit/publish | 5 | Documented |
| Enrollments | Exists | 78% | Beta | Lifecycle, capacity/waitlist, nested lists | List/create/cancel | 11 | Documented |
| Attendance | Partial | 73% | Beta | Manual/bulk, check-in/out, metrics; method fields include QR/biometric/GPS | List/create/bulk summaries | 11 | Documented |
| Evaluations | Exists | 82% | Beta | Definitions, questions, answers, submit, close, score/results | List/create/submit | 21 | Documented |
| Certificates | Partial | 72% | Beta | Eligibility, issue, revoke, verify, metadata document | List/issue/verify preview | 12 | Documented |
| SENCE | Partial | 38% | Concept | Local declaration/evidence/status/document-link workflow | Preparation dashboard/checklist | 15 | Documented as stub |
| Documents | Partial | 15% | Concept | Prisma metadata and internal references only | None | Indirect only | Roadmap |
| Notifications | Partial | 8% | Concept | Prisma model only; password email is console stub | Bell icon only | None | No active API |
| Audit | Partial | 45% | MVP | Persistent writes from selected use cases | None | Indirect assertions | Query API roadmap |
| Reports/Analytics | Partial | 25% | Concept | ReportSnapshot model; no report endpoints | Client-side dashboard/charts | Dashboard component test | Roadmap APIs |
| Finance | Partial | 12% | Concept | Budget/cost/tax-credit/invoice document fields only | Projected SENCE credit | None | No finance API |
| AI | Does not exist | 3% | Concept | No model provider, service, prompt, job, or endpoint | Marketing roadmap only | None | Roadmap endpoint |

## 5. Detailed Functional Audit

### 5.1 Core/System — 72%, Beta

**Objective:** Provide runtime configuration, health, HTTP composition, shared domain primitives, error handling, validation, pagination, logging, rate limiting, and demo bootstrap.

**Implemented:** Typed environment validation; production secret checks; Pino HTTP logs; Helmet; CORS allowlist; JSON size limit; global IP rate limit; health endpoints; central error mapping; request validation; pagination; use-case context; guarded production demo bootstrap.

**Incomplete/missing:** No readiness/dependency health distinction, correlation ID contract, metrics, tracing, centralized log sink configuration, graceful shutdown, background jobs, queue, cache, distributed locks, service-level objectives, feature-flag service, or operational admin endpoints. Demo bootstrap is a large service and a deployment-only capability rather than a general product module.

**Dependencies:** Express, Prisma, PostgreSQL, Pino, Zod.  
**Screens:** Demo banner consumes health; no operations console.  
**Events:** Domain-event base classes exist but no dispatcher or consumers were found.  
**Data:** AuditEvent and ReportSnapshot support concepts; health is not persisted.  
**Tests:** Health, security, demo bootstrap, and commercial E2E files.  
**Documentation/OpenAPI:** Health and deployment documented.

### 5.2 Authentication — 78%, Beta

**Objective:** Establish tenant and user identity and manage sessions/password recovery.

**Implemented:** Organization/admin registration, bcrypt password hashing, JWT access and refresh tokens, current-user lookup, login audit events, logout endpoint, forgot-password enumeration protection, hashed one-time reset tokens, reset-token invalidation, IP/user-agent metadata, and dedicated rate limits.

**Incomplete/missing:** Logout does not demonstrate server-side token revocation; refresh tokens are JWTs without a persisted session/rotation family; no MFA, SSO/SAML/OIDC, password policy administration, account lockout workflow, device/session list, compromised-password check, email provider, or verified email. Browser access and refresh tokens are persisted in Zustand/local storage, increasing XSS impact.

**Dependencies:** Users, organizations, roles/permissions, email abstraction.  
**Screens:** Login, forgot password, reset password.  
**Events:** AuditEvent writes; no domain-event delivery.  
**Data:** User, PasswordResetToken, roles and permissions.  
**Tests:** 11 backend cases plus login/front-end page coverage.  
**Documentation/OpenAPI:** Complete for active endpoints.

### 5.3 Organizations — 62%, MVP

**Objective:** Represent tenants and manage organization lifecycle.

**Implemented:** Create/list/get/update/replace/deactivate, tax-ID uniqueness, status/type/settings, audit writes, and tenant-aware relations.

**Incomplete/missing:** No frontend administration, OTEC-specific configuration, legal representative, accreditation, branches/offices, subscription/billing, branding, data residency, retention policies, tenant export/deletion, or per-tenant security configuration. List/read behavior deserves explicit platform-admin authorization review because organization administration is structurally cross-tenant.

**Dependencies:** Auth and RBAC.  
**Screens:** Workspace name is static/demo-derived; no administration screen.  
**Events:** Audit writes on create/update/deactivate.  
**Data:** Organization.  
**Tests:** Two focused tests.  
**Documentation/OpenAPI:** Documented.

### 5.4 RBAC — 58%, MVP

**Objective:** Enforce least-privilege access to protected tenant resources.

**Implemented:** Role, Permission, UserRole, and RolePermission schema; permission claims in JWT; `requireAuth` and `requirePermission`; route-level permissions; seeded demo permission matrix; 401/403 E2E assertions on core modules.

**Incomplete/missing:** No role/permission CRUD API or UI, no custom-role workflow, no resource/field-level authorization, no separation-of-duties controls, no access-review/certification, no JWT claim freshness mechanism, and no complete security test matrix for every method. Permission naming is inconsistent (`training_plan.*` singular versus plural module conventions).

**Dependencies:** Auth, users, organizations.  
**Screens:** None.  
**Events:** Assignment changes are not exposed as product workflows.  
**Data:** Four active RBAC models.  
**Tests:** Auth and security tests.  
**Documentation/OpenAPI:** Matrix exists; `/roles` is roadmap.

### 5.5 Users — 65%, MVP

**Objective:** Administer tenant users and their status/roles.

**Implemented:** Create/list/get/update/activate/deactivate, password hashing, role IDs, sanitized DTOs, tenant filters, and audit writes.

**Incomplete/missing:** No UI, invitation delivery/acceptance, bulk import, user self-service, role-management API, admin password reset, MFA state, identity federation, session management, or explicit concurrent-update protection.

**Dependencies:** Organizations, auth, RBAC.  
**Screens:** None.  
**Events:** Audit writes.  
**Data:** User and join models.  
**Tests:** Two focused tests.  
**Documentation/OpenAPI:** Documented.

### 5.6 Employees — 74%, Beta

**Objective:** Maintain worker identity and organizational attributes for training operations.

**Implemented:** Create/list/get/update, Chilean RUT handling, codes, contact details, department/area/position, status, hire date, tenant uniqueness, connected list/create/edit frontend.

**Incomplete/missing:** No termination workflow endpoint, bulk import/export, eligibility data for SENCE franchise bands, employment-contract type/history, salary bracket, consent/privacy workflow, document dossier, competence history UI, supervisor hierarchy, or HRIS integration.

**Dependencies:** Organizations; downstream enrollments, attendance, evaluations, certificates.  
**Screens:** Employees page and forms.  
**Events:** No domain events; no observed audit write for employee changes.  
**Data:** Employee.  
**Tests:** Four backend cases and form validation tests.  
**Documentation/OpenAPI:** Documented.

### 5.7 Courses and Catalog — 69%, MVP

**Objective:** Manage reusable training offerings and SENCE-relevant course metadata.

**Implemented:** Course CRUD/archive, code/name/description, modality, duration, validity, optional SENCE code, status, frontend list/forms/chart.

**Incomplete/missing:** CourseModule, Competency, and CourseCompetency models have no use cases/APIs/UI. No version history, pricing, approval workflow, objectives, target audience, prerequisites, detailed syllabus, materials, certificate rules, per-modality SENCE rules, authorizations/resolutions, franchise values, or course-code validity dates.

**Dependencies:** Organizations; used by plans, sessions, certificates, SENCE.  
**Screens:** Courses page.  
**Events/audit:** No domain events or observed audit write.  
**Data:** Course plus inactive supporting catalog models.  
**Tests:** Five backend cases and form tests.  
**Documentation/OpenAPI:** Course surface documented; advanced catalog is conceptual.

### 5.8 Training Plans — 67%, MVP

**Objective:** Manage annual training plans, budget, priorities, and approval.

**Implemented:** Annual plan CRUD/list, unique year per tenant, item creation, planned month/quarter, estimated participants/cost, priority, justification, approval/rejection, audit writes, and cross-tenant tests.

**Incomplete/missing:** Frontend is list/summary only; no plan creation/editing, item management, approval UI, submission transition, rejection reason model, revisions, budget consumption, multi-approver workflow, CBC approval/evaluation, attachments, scenario planning, or plan-vs-actual reporting.

**Dependencies:** Courses, organizations, RBAC.  
**Screens:** Training plans summary page.  
**Events:** Audit writes on major changes.  
**Data:** TrainingPlan and TrainingPlanItem.  
**Tests:** Six.  
**Documentation/OpenAPI:** Documented.

### 5.9 Instructors and Providers — 58% / 18%, MVP / Concept

**Objective:** Manage eligible trainers and supply organizations.

**Implemented:** Instructors have create/list/get/update, RUT, contact, specialties, provider/user links, status, tenant uniqueness, and tests. Provider has a rich schema only.

**Incomplete/missing:** No frontend, availability, qualifications, CV, certificates, eligibility rules, document expiry, contracts, evaluations, conflicts, rate/cost, assignment validation, or instructor compliance dossier. Provider CRUD is marked roadmap and absent.

**Dependencies:** Organizations, users, training sessions, documents.  
**Screens:** None.  
**Events/audit:** No observed audit writes.  
**Data:** Instructor and Provider.  
**Tests:** Four for instructors; none for providers.  
**Documentation/OpenAPI:** Instructor documented; provider roadmap.

### 5.10 Training Sessions — 72%, Beta

**Objective:** Plan concrete course delivery with schedule, capacity, provider, and instructor.

**Implemented:** Create/list/get/update/publish; date validation; course, plan-item, provider and instructor references; location, meeting URL, capacity and cost; connected frontend.

**Incomplete/missing:** No class-by-class schedule, rooms/resources, timezone, recurrence, attendance windows, instructor eligibility check, provider validation, cancellation/reschedule actions, completion/close actions, versioned changes, participant communication, calendar integration, modality-specific controls, or collision detection.

**Dependencies:** Courses, plans, instructors/providers.  
**Screens:** Training sessions page and form.  
**Events/audit:** No observed audit writes or emitted events.  
**Data:** TrainingSession.  
**Tests:** Five.  
**Documentation/OpenAPI:** Documented.

### 5.11 Enrollments — 78%, Beta

**Objective:** Enroll workers, enforce capacity and lifecycle rules, and support waitlists.

**Implemented:** Create/list/get/update; confirm/reject/cancel/complete; capacity check; duplicate prevention; inactive/cancelled/completed validation; FIFO waitlist promotion in a transaction; employee/session nested lists; tenant checks; connected create/cancel UI; audit writes for key transitions.

**Incomplete/missing:** No bulk import, eligibility engine, prerequisite validation, approval chain, attendance/evaluation-driven automatic completion, transfer, no-show state, reason taxonomy, participant self-service, communications, consent, or full lifecycle UI.

**Dependencies:** Employees, sessions, courses.  
**Screens:** Enrollments page.  
**Events:** Audit writes; no integration events.  
**Data:** Enrollment.  
**Tests:** Eleven.  
**Documentation/OpenAPI:** Documented.

### 5.12 Attendance — 73%, Beta

**Objective:** Record presence and compute session attendance.

**Implemented:** Manual and bulk records, check-in/out, status, methods enumerated as manual/QR/digital signature/biometric, QR token and signature storage fields, latitude/longitude, per-record metrics, session/employee lists, duplicate and tenant checks, connected frontend, and audit writes.

**Incomplete/missing:** QR token issuance/verification is not implemented; biometric capture/verification is not implemented; GPS is stored but no geofence/accuracy/consent validation exists; digital signature is a storage key without signing service; no offline capture/sync, anti-fraud, device identity, class-level attendance, instructor attestation, LCE integration, correction approval, immutable evidence, or official attendance certificate. Bulk operation atomicity and partial-failure behavior require production proof.

**Dependencies:** Enrollments, sessions, employees, documents.  
**Screens:** Attendance page.  
**Events:** Audit writes.  
**Data:** AttendanceRecord.  
**Tests:** Eleven.  
**Documentation/OpenAPI:** Documented.

### 5.13 Evaluations — 82%, Beta

**Objective:** Define assessments, collect answers, calculate results, and close evaluations.

**Implemented:** Multiple evaluation/question types, questions and correct answers, individual answers, submissions, responses, scores, pass/fail, close state, result calculation, tenant and enrollment guards, transaction-oriented orphan prevention, nested lists, connected frontend, and comprehensive module tests.

**Incomplete/missing:** No assessment versioning, randomized banks, attempt policy, proctoring, manual grading workflow, rubrics, evidence attachments, survey analytics, appeals, certificate-rule configuration, diagnostic/intermediate/final workflow semantics, or immutable closed-assessment enforcement across all changes.

**Dependencies:** Sessions, enrollments, employees, attendance.  
**Screens:** Evaluations page.  
**Events:** Extensive audit writes; no integration events.  
**Data:** Evaluation, Question, Response, Answer.  
**Tests:** Twenty-one, the strongest module suite.  
**Documentation/OpenAPI:** Documented.

### 5.14 Certificates — 72%, Beta

**Objective:** Determine eligibility, issue/revoke certificates, and support public verification.

**Implemented:** Attendance/evaluation eligibility, issue, list/get, revoke without deletion, public verification without sensitive PII, verification code, certificate number, expiry, document metadata generation, connected list/issue/verify UI, audit writes.

**Incomplete/missing:** No real PDF rendering, cloud/object storage, real QR generation, electronic signature, signer identity, tamper-evident artifact, download/streaming endpoint, template management, localization, batch issuance, delivery, renewal, or revocation list. Repository documentation acknowledges certificate-number race risk and hard-coded global attendance/evaluation assumptions.

**Dependencies:** Enrollments, attendance, evaluations, courses, sessions, documents.  
**Screens:** Certificates page and preview.  
**Events:** Audit writes.  
**Data:** Certificate; internal Document metadata.  
**Tests:** Twelve.  
**Documentation/OpenAPI:** Documented with known risks.

### 5.15 SENCE — 38%, Concept

See [Section 7](#7-detailed-sence-and-otec-audit) for the specialized audit.

### 5.16 Documents — 15%, Concept

**Objective:** Store and govern evidence and operational files.

**Implemented:** Document schema with type, name, MIME type, storage provider/key, size, checksum, uploader, timestamps, and soft delete. Attendance, certificates, and SENCE can reference metadata.

**Incomplete/missing:** No registered document router, upload/download, storage adapter, malware scan, content validation, retention, legal hold, versioning, document status, signatures, access grants, preview, deletion workflow, encryption policy, or frontend. Certificate generation creates local-stub metadata only.

### 5.17 Notifications — 8%, Concept

**Implemented:** Notification Prisma model and a bell icon. Password-reset email uses a console stub.

**Missing:** Module, repository, use cases, API, UI inbox, templates, preferences, email/SMS providers, queues, retries, delivery receipts, suppression, and monitoring.

### 5.18 Audit — 45%, MVP

**Implemented:** AuditEvent schema and Prisma audit logger capture tenant, actor, entity, action, metadata, before/after, IP, user agent, and timestamp. Important auth, plan, enrollment, attendance, evaluation, certificate, SENCE, organization, and user actions write records.

**Incomplete/missing:** No query API/UI, export, retention, integrity chaining, immutability controls, external SIEM delivery, alerting, search indexes, access governance, or completeness guarantee. Some modules do not visibly audit changes. Audit writes often occur after business persistence without a shared transaction, so business success with audit failure—or vice versa—requires explicit handling.

### 5.19 Reports, Analytics, Finance, and AI — 25% / 12% / 3%, Concept

**Reports/analytics:** Dashboard and charts exist, but aggregate data is computed client-side from capped lists. ReportSnapshot exists without an active module. Dedicated report endpoints are roadmap.

**Finance:** Training plan budgets, session costs, declared amounts, tax credits, and invoice document types exist as isolated fields. There is no ledger, invoicing, payment, reconciliation, tax-credit calculation engine, cost allocation, purchase order, OTIC settlement, or financial reporting.

**AI:** Marketing and OpenAPI describe future recommendations, but no runtime AI code, provider, model, prompt, embedding, evaluation, governance, cost control, or endpoint exists.

## 6. Technical and Architectural Audit

| Capability | Rating | Evidence and conclusion |
|---|---|---|
| DDD | Good | Entities, aggregates, value objects, repositories, and domain services exist. Several aggregates remain CRUD-oriented and domain events are unused. |
| Clean Architecture | Good | Clear domain/application/infrastructure/interface layers and inward-facing repository interfaces. Composition is manual in route factories. |
| SOLID | Good | Focused use cases and interfaces support substitution. Some large bootstrap/UI components and repeated module assembly reduce maintainability. |
| Repository Pattern | Excellent | Consistently applied across all active modules with Prisma adapters and tenant filters. |
| CQRS | Deficient | Separate use-case classes exist, but no command/query model separation, buses, projections, or consistency strategy. |
| Domain/Integration Events | Deficient | Base primitives exist; no event registration in aggregates, dispatcher, outbox, broker, consumer, retry, or replay. |
| Modular design | Good | Strong folder and naming consistency across 13 business areas. Schema-only concepts blur implemented module boundaries. |
| Decoupling | Good | Domain avoids Prisma imports and services are injectable. Runtime composition directly constructs concrete repositories/services. |
| Performance | Acceptable | Pagination and indexes exist. Dashboard fans out eight requests; SENCE snapshot uses broad nested reads; no profiling/load evidence. |
| Scalability | Deficient | In-memory rate-limit maps are instance-local and unbounded; no Redis/cache/queue; concurrency controls are incomplete. |
| Security | Acceptable | JWT/RBAC, bcrypt, Helmet, CORS, input validation, payload limits, and rate limits exist. Token storage and session/revocation design are weak for production. |
| Test coverage | Deficient | Good test count and critical-flow cases, but no numerical coverage, mutation testing, frontend test CI, broad contract tests, or load/security testing. |
| Logging | Acceptable | Structured HTTP logs via Pino. Business logging conventions, redaction evidence, and centralized transport are absent. |
| Observability | Critical | No metrics, traces, alert rules, dashboards, SLOs, error-monitoring service, or dependency telemetry. |
| Configuration | Good | Zod-validated environment with production secret checks and examples. No secret manager integration or environment promotion controls. |
| Feature flags | Deficient | Only demo bootstrap enablement is an environment flag; no general flag service, targeting, lifecycle, or audit. |
| Multi-tenancy | Good | Tenant IDs and composite relations are pervasive and cross-tenant tests exist. No database RLS, platform-admin model, tenant provisioning isolation, or automated isolation matrix. |
| RBAC | Acceptable | Route checks and schema exist. Administration, claim freshness, access reviews, and separation of duties are missing. |
| Audit | Acceptable | Rich persistent audit writes exist. Read/search/export, tamper resistance, and transactional completeness are missing. |
| Soft delete | Good | `deletedAt` is widespread and active repositories generally filter it. Uniqueness across deleted records is explicitly an acknowledged MVP limitation. |
| Versioning | Deficient | Entity `version` increments exist, but repository updates do not compare the prior version; lost updates remain possible. No API ETags. |
| API versioning | Good | Active routes are under `/api/v1`; root health is intentionally separate. |
| Rate limiting | Acceptable | Global, login, and password-reset limits exist. They are in-memory, IP-only, instance-local, and lack cleanup/distributed enforcement. |
| Idempotency | Critical | No idempotency-key middleware or persisted request deduplication was found for create/issue/submit operations. Unique constraints mitigate only selected duplicates. |
| Data integrity | Good | Composite tenant relations, unique constraints, indexes, and selected transactions are strong. Several multi-write business/audit operations are not atomic. |
| API documentation | Good | OpenAPI covers active surface and labels roadmap paths. It mixes Spanish content and future contract with current runtime, increasing consumer ambiguity. |
| Delivery automation | Acceptable | CI, Dockerfile, Compose, and Render descriptor exist. No release promotion, rollback, IaC, migrations job, vulnerability scanning, or frontend tests in CI. |

### 6.1 Repeated patterns and technical debt

- Module assembly repeatedly constructs repositories, use cases, controllers, and routers. A typed composition root could reduce duplication without introducing a heavy framework.
- CRUD modules repeat pagination, tenant checks, mapping, and audit boilerplate; shared abstractions should be introduced carefully so domain behavior remains explicit.
- `version` is repeated across nearly all models but does not deliver optimistic concurrency because it is not part of update predicates.
- `deletedAt` is repeated correctly, but strict unique constraints prevent reuse after soft deletion; the schema comments already identify partial unique indexes as a production need.
- Status transitions are expressed in entities, but no unified state-transition/audit/event policy exists.
- Frontend list pages repeat query/filter/table/error patterns; existing shared resource components only partially consolidate them.

### 6.2 Security-specific findings

1. **High — browser token exposure:** Access and refresh tokens persist in local storage through Zustand. Any successful XSS can exfiltrate both. Prefer a hardened BFF or HttpOnly, Secure, SameSite cookies with CSRF controls.
2. **High — no refresh-session revocation:** No persisted refresh session, rotation family, reuse detection, or logout invalidation was found.
3. **High — distributed brute-force/rate controls absent:** In-memory maps reset per process and do not coordinate across replicas. They may also grow with unique IPs until process restart.
4. **High — audit is not tamper-evident or queryable:** Evidence exists but lacks operational governance and integrity proof.
5. **Medium — no idempotency:** Certificate issuance, SENCE submission, and other writes can be retried by networks/users without a general deduplication contract.
6. **Medium — no database tenant policy:** Application filters are the only observed tenant boundary; PostgreSQL row-level security is absent.
7. **Medium — external/file inputs are immature:** Document upload, scanning, signed URLs, and content policies do not exist yet.
8. **Medium — dependency/security automation absent:** CI has no dependency audit, secret scan, SAST, DAST, SBOM, or container scan.

## 7. Detailed SENCE and OTEC Audit

### 7.1 Repository-implemented SENCE foundation

The implemented local aggregate stores a training-session link, optional SENCE code, declared amount, tax-credit amount, external code, status, submission time, response payload, tenant, soft-delete timestamp, and version. Its states are `DRAFT`, `READY`, `SUBMITTED`, `ACCEPTED`, `REJECTED`, and `OBSERVED`.

Implemented actions:

- Create, read, list, and update declarations.
- Retrieve a declaration by training session.
- Validate a local compliance snapshot.
- Build a logical evidence summary.
- Mark a valid declaration ready.
- Mark a ready declaration submitted using `submissionMode: MANUAL_STUB`.
- Manually update the external-like status to accepted, rejected, or observed.
- Associate existing Document records and list those associations.
- Record audit events for SENCE actions.
- Display a SENCE dashboard, evidence checklist, filters, projected credits, and action buttons.

The validator checks session/course presence and activity, participant presence, one attendance record per participant, certificate presence for participants at or above a fixed 75% threshold, optional evaluation warning, and cross-tenant consistency. The evidence builder produces summaries for session, participant list, attendance, certificates, evaluations, course, and instructor/provider identifiers.

### 7.2 Current official operational benchmark

Official sources distinguish a broader lifecycle than the local declaration stub:

- SENCE describes franchise activity handling as **communicate, rectify, annul, and pre-liquidate/liquidate**, and requires operational data about participants and execution. [SENCE franchise process](https://sence.gob.cl/empresas/franquicia/franquicia-para-empresas)
- For franchise eligibility, SENCE identifies a 75% minimum attendance for participants and 100% of established hours for distance e-learning, demonstrating that one global threshold is insufficient. [SENCE Tax Franchise](https://sence.gob.cl/empresas/franquicia-tributaria)
- SENCE's LCE supports course preparation, online/offline attendance, biometric enrollment/verification, contingency operation, and official attendance certificates. [SENCE Electronic Class Book](https://sence.gob.cl/organismos/libro-de-clases-electronico-lce)
- SENCE identifies modality-specific liquidation evidence: paid invoice and LCE attendance certificate for in-person courses; OTEC and participant sworn statements for e-learning; combinations for mixed courses. It also identifies delivery/liquidation time limits. [SENCE franchise process for CFT/executors](https://sence.gob.cl/empresas/franquicia/franquicia-para-cft)
- OTEC accreditation is managed through RUDO, and accredited entities must keep legal/operational data current. [ChileAtiende OTEC accreditation](https://www.chileatiende.gob.cl/fichas/39693)
- Official OTEC guidance states that NCh2728 must remain continuously current and that loss of coverage can cause cessation; organization, representative, office, and certification information must be maintained. [SENCE OTEC update manual](https://sence.gob.cl/sites/default/files/manual_de_actualizacion_de_antecedentes_para_otec_ene_y_cft_normado_por_el_decreto_supremo_186.pdf)
- E-learning courses require connectivity/control processes and current official guidance. [SENCE e-learning control](https://sence.gob.cl/organismos/control-e-learning-otec)

These references are a benchmark as of the audit date. Legal and procedural validation by a qualified Chilean compliance professional remains necessary before production use.

### 7.3 SENCE capability matrix

| Capability | Status | Repository evidence | Gap |
|---|---|---|---|
| SENCE configuration | Does not exist | Generic Organization settings and Course.senceCode only | No dedicated configuration, credentials, environment, regional office, or policy versions. |
| OTEC identity | Partial | Organization has type `OTEC`, legal name, tax ID | No RUDO registration, OTEC code, legal representative, offices, technical contact, accreditation state. |
| NCh2728 validity | Does not exist | No fields/workflow | Certification number, certifier, scope, issue/expiry, continuity alerts, evidence, cessation risk. |
| Resolutions and validity | Does not exist | No resolution model | Resolution type/number/date, scope, version, attachment, expiry, supersession. |
| SENCE course code | Partial | `Course.senceCode` | No authorization history, validity, update, value-hour, target population, area/specialty, official status. |
| Course hours/modality | Partial | Duration and broad modality enum | No chronological/pedagogical hour rules or modality-specific compliance configuration. |
| Instructor assignment | Partial | TrainingSession.instructorId/providerId | No eligibility, qualifications, specialty proof, document validity, conflict checks. |
| Action creation | Partial | TrainingSession + SenceDeclaration | No official communication record, folio, channel, deadlines, or payload contract. |
| Action editing | Partial | Session/declaration updates | No governed rectification workflow or change reason/approval. |
| Planning/states | Partial | Session and declaration states | No full communicate/execute/rectify/annul/pre-liquidate/liquidate lifecycle. |
| Versioning | Partial | Integer increments | No immutable versions, official payload snapshots, or optimistic concurrency. |
| Participant enrollment | Partial | Enrollment module | No SENCE communication state per participant. |
| Eligibility | Deficient | Active employee/course and tenant checks | No contract modality, salary/franchise band, contribution status, pre/post-contract rules, or exclusion rules. |
| Bulk participant load | Does not exist | Bulk attendance only | No CSV/template import, row validation, correction, or reconciliation. |
| Participant history | Partial | Cross-module records exist | No consolidated regulatory dossier/timeline. |
| In-person attendance | Partial | Manual check-in/out | No LCE connection or official certificate. |
| Online attendance | Deficient | Meeting URL and generic timestamps | No connectivity log, redirection/control, session heartbeat, or 100%-hours rule. |
| QR attendance | Concept only | Method enum and qrToken field | No token lifecycle, scan endpoint, signature, replay protection, or QR UI. |
| Biometric attendance | Concept only | Method enum | No biometric enrollment, template handling, device integration, consent, or matching. |
| GPS attendance | Concept only | Latitude/longitude fields | No accuracy, geofence, spoofing control, or privacy workflow. |
| Schedule control | Partial | Session start/end and record check-in/out | One attendance record per enrollment does not model multiple classes/blocks. |
| Diagnostic evaluation | Partial | `DIAGNOSTIC` type | No dedicated regulatory workflow. |
| Intermediate evaluation | Does not exist | No explicit type/stage | Must be modeled through generic assessments. |
| Final evaluation | Partial | Generic knowledge/practical assessments | No explicit final-assessment policy or regulatory mapping. |
| Grades/pass/fail | Exists | Scores, passing score, passed flag | Policies are not versioned or tied to official course rules. |
| Instructor documents | Does not exist | Generic Document exists without module | No dossier, expiry, review, or eligibility control. |
| Class book | Does not exist | Evidence summary only | No class/session records, content delivery, signatures, corrections, or LCE. |
| Declarations/affidavits | Does not exist | SENCE declaration is not an affidavit | No OTEC/participant sworn statement generation or signature. |
| Minutes and evidence files | Partial | Generic metadata and SENCE links | No upload/storage/preview/integrity workflow. |
| Backup/retention | Does not exist | No policy/configuration | No retention schedule, legal hold, restoration evidence, or export package. |
| Certificate generation | Partial | Metadata stub | No real official PDF. |
| Certificate QR | Does not exist | Verification code; visual placeholder | Generate a real signed QR/URL and validate artifact integrity. |
| Certificate validation | Partial | Public verification API | Not an official SENCE/LCE certificate validation. |
| Electronic signature | Does not exist | Digital-signature attendance method name only | No signing provider, certificate validation, timestamp, signer, or evidence. |
| Download/delivery | Does not exist | Storage-key metadata | No file endpoint, signed URL, email, or participant portal. |
| Declaration states | Partial | Six local states | No official state synchronization/history or per-submission attempts. |
| Corrections/resubmission | Deficient | Manual update/status | No structured observation items, correction tasks, payload diffs, attempt history, or deadlines. |
| SENCE integration | Does not exist | Explicit `MANUAL_STUB` | No API/web-service connector, authentication, mapping, retries, reconciliation, or monitoring. |
| OTIC integration | Does not exist | No code | No OTIC entities, contracts, communication, settlement, or status exchange. |
| Email/SMS | Does not exist | Console reset-email stub only | No production provider or notification orchestration. |
| Electronic-signature integration | Does not exist | No adapter | Select provider and implement legal/technical controls. |
| SENCE audit trail | Partial | Rich local AuditEvent writes | No read UI/API, integrity protection, export, or official-message archive. |
| Reports | Deficient | UI counts and evidence summary | No regulatory operational reports, exports, filters, reconciliation, or scheduled distribution. |
| KPIs/dashboard | Partial | Local counts/credit sum | Calculated from capped client lists; no certified financial/compliance metrics. |

### 7.4 SENCE maturity conclusion

**Functional maturity:** Concept (38%).  
**Technical maturity of the local slice:** MVP.  
**Regulatory/operational readiness:** Critical gap.  
**Integration maturity:** Not implemented.  
**Safe claim:** The product prepares a local evidence checklist and declaration record for internal review.  
**Unsafe claim:** The product submits to, complies with, certifies, or reconciles against SENCE or OTIC systems.

## 8. Gap Analysis

| Gap | Status | What is missing | Complexity | Priority | Dependencies | Impact |
|---|---|---|---|---|---|---|
| Production SENCE lifecycle | Not implemented | Communicate, rectify, annul, pre-liquidate/liquidate, payload/version history | XL | Must Have | Official contracts, SENCE expertise, documents, jobs | Core OTEC value proposition cannot be fulfilled. |
| LCE/e-learning controls | Not implemented | Official attendance/connectivity integration and modality rules | XL | Must Have | SENCE interfaces, identity, devices, compliance | Attendance is not regulatory evidence. |
| OTEC accreditation configuration | Not implemented | RUDO/OTEC identity, NCh2728, offices, representatives, resolutions, expiry alerts | L | Must Have | Organizations, documents, notifications | Cannot manage certified OTEC operating status. |
| Document platform | Not implemented | Secure upload/download/storage, scanning, checksum verification, retention, versioning | XL | Must Have | Object storage, security, audit | Certificates and SENCE evidence remain stubs. |
| Real certificates | Partial | PDF templates, signed QR, signature, storage, download, delivery | L | Must Have | Documents, signing, notifications | Current artifact is not distributable or tamper-evident. |
| Session/class structure | Partial | Individual classes/blocks, agenda, content, instructors, attendance windows | L | Must Have | Sessions, attendance | One record cannot prove multi-class attendance. |
| Participant eligibility | Partial | Employment relation, salary band, contributions, pre/post-contract and franchise rules | XL | Must Have | Employees, rules engine, SENCE | Tax-credit and eligibility values are unreliable. |
| Role administration | Partial | Role/permission CRUD, UI, claim refresh, access reviews | L | Must Have | Auth, users, audit | RBAC cannot be operated safely by customers. |
| Refresh-session security | Partial | Persisted sessions, rotation, reuse detection, revocation, secure web session | L | Must Have | Auth, frontend/BFF | Account compromise impact is too high. |
| Distributed rate limit/idempotency | Not implemented | Redis/shared enforcement and idempotency records | M/L | Must Have | Infrastructure, API conventions | Horizontal scaling and safe retries are unreliable. |
| Observability | Not implemented | Metrics, tracing, error monitoring, alerts, SLOs, runbooks | L | Must Have | Hosting/telemetry platform | Production failures cannot be detected or diagnosed reliably. |
| Audit access/integrity | Partial | Query/export/UI, retention, SIEM, append-only/tamper evidence | L | Must Have | Audit, RBAC, storage | Compliance evidence cannot be operationally used. |
| Provider/instructor compliance | Partial | Provider CRUD, trainer dossier, qualifications, expiry and assignment validation | L | Should Have | Documents, notifications | Operational staffing remains manual. |
| Course regulatory catalog | Partial | Authorization/versioning, syllabus, official validity and financial rules | L | Should Have | Courses, documents, SENCE | Actions can be planned with incomplete compliance metadata. |
| Bulk operations | Not implemented | Employee/participant/course imports, validation reports, reconciliation | M | Should Have | Background jobs, documents | Real OTEC data onboarding will be slow and error-prone. |
| Notifications | Not implemented | Email/SMS providers, templates, preferences, queues, retries | L | Should Have | Jobs, providers, audit | Deadlines and participant workflows depend on manual action. |
| Reporting | Partial | Server aggregates, exports, scheduled reports, regulatory/financial KPIs | L | Should Have | Data model, jobs | Dashboard is incomplete and capped. |
| Finance | Not implemented | Invoices, payments, cost allocation, OTIC settlement, tax-credit engine | XL | Could Have | Providers, SENCE, accounting integration | No end-to-end commercial administration. |
| AI | Not implemented | Governed use cases, data readiness, provider, evaluation, privacy/cost controls | XL | Future | Reliable domain data and analytics | Current AI branding is not supported by runtime behavior. |
| Test assurance | Partial | Coverage thresholds, contract/integration suites, frontend CI tests, performance/security tests | L | Must Have | Stable test data/environments | Regression and release risk remain high. |
| Documentation accuracy | Partial | Replace stale project analysis; separate current API from roadmap; English consistency | S/M | Quick Win | Product ownership | Buyers and engineers may misunderstand product state. |

## 9. Roadmap

The roadmap intentionally prioritizes production truth and regulatory foundations before expanding AI or finance.

### 9.1 Quick Wins

1. Correct `docs/project-analysis.md`, which incorrectly says no application backend/frontend exists.
2. Publish separate “current” and “roadmap” API views, or exclude `x-implementation-status: roadmap` operations from generated production documentation.
3. Add frontend tests to CI so the locally passing component suite becomes a release gate.
4. Add test coverage tooling and risk-based thresholds; report branch coverage separately.
5. Replace static settings rows with explicit “demo-only” labels and remove any implication of active policy management.
6. Rename commercial SENCE actions from “send” to “mark manually submitted” everywhere.
7. Add a visible disclaimer to certificate preview that no PDF, signature, or real QR is generated.
8. Add explicit modality-aware SENCE validation so e-learning is not evaluated with the same 75% rule as in-person training.
9. Standardize permission naming and audit action naming.
10. Add automated OpenAPI-to-route drift checks.

### 9.2 Must Have — Production foundation

1. Define the supported market boundary: internal HR training, OTEC operations, franchise administration, or all three.
2. Implement secure session architecture, distributed rate limiting, idempotency, and database-backed concurrency control.
3. Implement document storage, upload/download, scanning, retention, and integrity verification.
4. Make AuditEvent queryable, exportable, access-controlled, and tamper-evident.
5. Add metrics, traces, error monitoring, alerting, SLOs, runbooks, backup/restore tests, and disaster-recovery objectives.
6. Complete RBAC administration and tenant/platform-administrator boundaries.
7. Establish coverage, contract, E2E, migration, performance, accessibility, and security gates.
8. Implement real certificate rendering, QR, signing, storage, revocation evidence, and delivery.
9. Model class blocks and modality-specific attendance evidence.

### 9.3 Must Have — OTEC/SENCE foundation

1. Engage a named OTEC/SENCE domain owner and create versioned regulatory requirements with effective dates and source references.
2. Add OTEC accreditation, RUDO identity, NCh2728 continuity, offices, legal representatives, contacts, resolutions, and expiry alerts.
3. Expand course authorization and participant eligibility models.
4. Implement structured evidence packages, declarations/affidavits, invoices/payment evidence, and correction workflows.
5. Model the complete communication-to-liquidation lifecycle and deadline engine.
6. Build SENCE/OTIC adapters only against confirmed, supported interfaces; use queues, retries, idempotency, reconciliation, and manual recovery.
7. Add LCE and e-learning connectivity controls or explicitly scope them out with a supported manual evidence process.

### 9.4 Should Have

- Provider and instructor compliance dossier.
- Bulk imports with dry-run validation and row-level error reports.
- Notification service with email/SMS delivery, retries, and preferences.
- Server-side reporting, exports, and scheduled compliance packs.
- Course modules/competencies and training-need linkage.
- Complete frontend administration for organizations, users, roles, instructors, providers, documents, and audit.
- Accessibility audit and responsive workflow validation.

### 9.5 Could Have

- Finance/OTIC settlement and accounting integration.
- HRIS, calendar, electronic-signature, and payroll integrations.
- White-labeling and tenant-specific workflow/rule configuration.
- Participant and instructor self-service portals.
- Advanced planning scenarios and cost optimization.

### 9.6 Future

- AI training-gap recommendations only after competency, history, outcome, and governance data are reliable.
- Forecasting, anomaly detection, and document assistance with human review, traceability, privacy controls, evaluation datasets, and model-cost budgets.
- Enterprise federation, SCIM, fine-grained policy engines, data residency, and multi-region architecture when justified by customer requirements.

## 10. Maturity Matrix

Scores use a 0–100 scale. Low scores for absent modules reflect conceptual schema/OpenAPI artifacts rather than usable behavior.

| Module | Functional | Technical | Architecture | Testing | Security | Scalability | Documentation | UX | Commercial | Enterprise |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Core/System | 72 | 72 | 78 | 62 | 65 | 45 | 72 | 45 | 68 | 42 |
| Authentication | 78 | 72 | 74 | 76 | 58 | 55 | 72 | 70 | 74 | 45 |
| Organizations | 62 | 70 | 74 | 45 | 62 | 60 | 70 | 15 | 55 | 42 |
| RBAC | 58 | 68 | 72 | 58 | 65 | 60 | 76 | 10 | 52 | 40 |
| Users | 65 | 70 | 74 | 46 | 60 | 60 | 70 | 10 | 55 | 40 |
| Employees | 74 | 72 | 75 | 60 | 65 | 62 | 72 | 76 | 72 | 48 |
| Courses | 69 | 70 | 74 | 62 | 64 | 62 | 72 | 78 | 70 | 45 |
| Training Plans | 67 | 71 | 75 | 65 | 66 | 62 | 74 | 45 | 68 | 48 |
| Instructors | 58 | 69 | 73 | 58 | 63 | 60 | 66 | 5 | 50 | 35 |
| Providers | 18 | 25 | 45 | 0 | 20 | 30 | 30 | 0 | 15 | 10 |
| Training Sessions | 72 | 72 | 75 | 64 | 66 | 62 | 74 | 78 | 74 | 48 |
| Enrollments | 78 | 78 | 78 | 78 | 72 | 68 | 76 | 72 | 78 | 58 |
| Attendance | 73 | 74 | 76 | 74 | 60 | 58 | 76 | 72 | 72 | 46 |
| Evaluations | 82 | 80 | 80 | 86 | 72 | 65 | 78 | 68 | 78 | 60 |
| Certificates | 72 | 74 | 76 | 80 | 64 | 55 | 80 | 72 | 70 | 42 |
| SENCE | 38 | 62 | 70 | 74 | 58 | 45 | 78 | 65 | 45 | 25 |
| Documents | 15 | 28 | 45 | 10 | 20 | 25 | 45 | 0 | 15 | 10 |
| Notifications | 8 | 15 | 30 | 0 | 15 | 15 | 20 | 5 | 8 | 5 |
| Audit | 45 | 65 | 68 | 42 | 55 | 52 | 62 | 0 | 42 | 30 |
| Reports/Analytics | 25 | 35 | 42 | 30 | 40 | 25 | 45 | 65 | 40 | 20 |
| Finance | 12 | 20 | 30 | 0 | 20 | 20 | 25 | 15 | 15 | 8 |
| AI | 3 | 5 | 10 | 0 | 5 | 5 | 20 | 15 | 5 | 2 |

## 11. Risks

### 11.1 Critical risks

1. **Regulatory misrepresentation:** SENCE is a manual local stub. Selling it as an official integration or compliant end-to-end OTEC process would create legal, commercial, and reputational exposure.
2. **No production observability:** The platform lacks the minimum telemetry and alerting needed to operate customer workloads responsibly.
3. **No idempotency or effective optimistic concurrency:** Financially/regulatorily important actions can be duplicated or overwritten under retry/concurrency conditions.
4. **Document and certificate artifacts are not real:** No secure evidence storage, real PDFs, signatures, real QR codes, or downloads exist.
5. **Coverage is unknown:** Passing tests do not establish how much behavior is exercised, and frontend tests are omitted from CI.

### 11.2 High risks

1. Refresh/access tokens persist in browser storage and refresh sessions are not revocable.
2. In-memory rate limits do not protect a horizontally scaled deployment.
3. Tenant isolation depends on application discipline rather than database policy and exhaustive automated tests.
4. Audit records are not queryable or tamper-evident and may not be atomic with business writes.
5. Certificate-number generation has a documented race condition.
6. The dashboard derives totals from lists capped at 100 records, producing incorrect metrics at modest scale.
7. SENCE validation uses an oversimplified fixed threshold and one attendance record per participant.
8. Provider, instructor compliance, OTEC accreditation, and document expiry are not operationally controlled.
9. CI lacks security, dependency, secret, and container scanning.
10. Documentation can mislead: `docs/project-analysis.md` describes a different repository state.

### 11.3 Medium risks

- Strict uniqueness across soft-deleted rows prevents expected reuse and may force manual data repair.
- Roadmap endpoints in the same OpenAPI contract may be mistaken for available capabilities.
- Permission and audit-action naming inconsistencies complicate governance and analytics.
- Manual dependency construction and repeated module patterns increase maintenance cost.
- No accessibility conformance evidence exists for the frontend.
- No database backup, restoration, retention, or disaster-recovery evidence exists.
- No load, soak, chaos, migration rollback, or penetration test evidence exists.

## 12. Recommendations

### 12.1 Immediate executive decisions

1. Reposition the current release as a **training operations MVP with SENCE preparation**, not an enterprise SENCE platform.
2. Select one primary buyer and operating model for the next release: enterprise HR team, OTEC, or OTIC-adjacent workflow. The current schema attempts to cover all three without completing any enterprise operating model.
3. Appoint a product owner for regulatory traceability and require every SENCE rule to include source, effective date, applicability, test cases, and version history.
4. Establish a production-readiness gate that prevents commercial launch until security sessions, documents, observability, audit access, idempotency, backup/restore, and release assurance are complete.

### 12.2 Architectural recommendations

1. Keep the modular Clean Architecture; do not rewrite it. Add a typed composition root and reduce construction boilerplate incrementally.
2. Implement optimistic concurrency using `version` in database update predicates and return conflict responses/ETags.
3. Add a transactional outbox before introducing external SENCE, OTIC, notification, or document-processing integrations.
4. Use a durable job queue for external calls, report generation, document rendering, notifications, and bulk imports.
5. Add distributed rate limiting and idempotency storage using a shared data store.
6. Treat documents as a first-class bounded context with storage adapters, security scanning, signed access, checksum verification, retention, and legal evidence metadata.
7. Separate regulatory rules from UI/use-case code with versioned policy objects and test fixtures.
8. Build server-side analytical projections rather than assembling KPIs from paginated operational endpoints.

### 12.3 Quality recommendations

1. Configure backend and frontend coverage with initial observed baselines, then set risk-based branch thresholds rather than arbitrary universal targets.
2. Add route/OpenAPI contract tests and a generated drift report to CI.
3. Run frontend tests in CI and add browser E2E coverage for authentication and the commercial core flow.
4. Add tenant-isolation parameterized tests across every repository and protected route.
5. Add concurrency tests for enrollment capacity, waitlist promotion, certificate issuance, SENCE transitions, and update conflicts.
6. Add accessibility, performance, dependency, SAST, secret, container, and migration checks.
7. Preserve a disposable, seeded integration environment and publish test evidence for each release.

### 12.4 Enterprise-readiness recommendations

- Identity: OIDC/SAML SSO, MFA, SCIM, session/device management, configurable policies.
- Governance: role administration, separation of duties, access reviews, data retention, export/deletion, legal holds.
- Operations: SLOs, metrics, tracing, SIEM, alerts, incident response, backup restoration, DR tests.
- Platform: documented tenancy model, database tenant controls, encryption/key management, capacity tests, safe migrations, rollback.
- Integrations: versioned adapters, contractual schemas, secrets rotation, idempotency, retries, circuit breakers, reconciliation, human recovery.
- Commercial: supported-scope matrix, service terms, implementation playbook, onboarding/import tools, support runbooks, customer-facing status and audit exports.

## 13. Verification Record

### 13.1 Commands and results

| Check | Result |
|---|---|
| `npm run build` | Passed |
| `npm run lint` | Passed |
| `npm test -- --reporter=verbose` | Passed: 113/113 tests in 14 files |
| `npm run prisma:validate` | Passed |
| `frontend: npm run lint` | Passed |
| `frontend: npm test -- --reporter=verbose` | Passed: 16/16 tests in 8 files |
| `frontend: npm run build` | Passed outside restricted sandbox; all application pages compiled and generated |

### 13.2 Principal repository evidence

- Runtime composition: `src/app.ts`, `src/interfaces/http/routes/api.routes.ts`.
- Data model: `prisma/schema.prisma`, `prisma/migrations/`.
- Module behavior: `src/modules/*/application`, `domain`, `infrastructure`, and `interfaces`.
- Tests: `src/modules/*.test.ts`, `src/application/system/bootstrap-demo.test.ts`, `src/tests/*.e2e.test.ts`, `frontend/test/`.
- Frontend behavior: `frontend/app/`, `frontend/features/`, `frontend/hooks/`, `frontend/lib/api/client.ts`, `frontend/stores/auth-store.ts`.
- API status: `docs/api-spec.yml`, `docs/openapi-implementation-report.md`.
- RBAC: `docs/rbac-matrix.md`, auth middleware and routes.
- Delivery: `.github/workflows/backend-ci.yml`, `Dockerfile`, `docker-compose.yml`, `render.yaml`.
- Explicit stub/roadmap disclosures: `README.md`, `frontend/README.md`, `docs/data-model.md`, `docs/demo-script.md`, and SENCE/certificate use cases.

### 13.3 Final audit statement

The repository demonstrates disciplined engineering for an early product: typed code, consistent module boundaries, tenant-aware persistence, a substantial active API, a coherent UI, and passing automated checks. The evidence does not support Production or Enterprise maturity. The most responsible next step is to harden the cross-cutting production platform and complete the documentary/regulatory foundation before attempting real SENCE, OTIC, finance, or AI expansion.
