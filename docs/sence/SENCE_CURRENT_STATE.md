# SENCE Current State

## Purpose and Evidence Boundary

This document records only behavior evidenced in the SkillFlow AI repository as of July 16, 2026. It does not infer deployed behavior or official integration. Official SENCE, RUDO, OTIC, and LCE connectivity does not exist in the repository.

## Classification

| Label | Meaning |
|---|---|
| Implemented | Registered runtime behavior with source and tests |
| Partial | Usable slice with material operational gaps |
| Simulated | Local behavior explicitly implemented as a stub or placeholder |
| Not implemented | No usable runtime behavior found |
| Roadmap | Documented future contract or marketing direction only |

## Existing Data Entities

| Entity | State | Evidence and limitations |
|---|---|---|
| Organization | Implemented | Supports `OTEC` type, legal name, tax ID, status, and generic settings. It has no OTEC accreditation fields. |
| Course | Partial for SENCE | Includes duration, modality, status, and optional `senceCode`; no authorization history or code validity. |
| Instructor/Provider | Partial | Instructor CRUD exists; Provider is schema-only. No eligibility or regulatory dossier. |
| TrainingSession | Implemented | Links course, instructor/provider, dates, location, meeting URL, cost, capacity, and status. No class blocks. |
| Enrollment | Implemented | Participant/session lifecycle and waitlist behavior. No franchise eligibility or official communication status. |
| AttendanceRecord | Partial | Manual/bulk/check-in/out and metrics exist. QR, biometric, signature, and GPS fields do not provide real integrations. |
| Evaluation records | Implemented | Evaluation definitions, questions, answers, responses, scoring, pass/fail, and close behavior. |
| Certificate | Partial | Eligibility, issue, revoke, and public verification exist. PDF generation, QR, signature, delivery, and secure storage do not. |
| SenceDeclaration | Partial | Local declaration with status, amounts, codes, submission time, and JSON response metadata. |
| SenceDocument | Partial | Associates an existing Document identifier to a declaration. |
| Document | Concept | Prisma metadata model only; no active upload/download/storage module. |
| AuditEvent | Partial | Persistent write model with actor, tenant, action, before/after, IP, and user agent; no query API/UI or tamper evidence. |

## Existing SENCE Use Cases

- Create, list, retrieve, and update a local SENCE declaration.
- Retrieve a declaration by training session.
- Build a logical evidence summary.
- Validate a local compliance snapshot.
- Mark a valid declaration ready.
- Mark a ready declaration submitted using `submissionMode: MANUAL_STUB`.
- Manually update status to accepted, rejected, or observed.
- Attach and list document references.

The use cases live under `src/modules/sence/application/use-cases/`. They use tenant context and record audit events for sensitive SENCE actions.

## Existing HTTP Surface

The registered `/api/v1` surface includes:

- `GET|POST /sence/declarations`
- `GET|PUT /sence/declarations/:declarationId`
- `POST /sence/declarations/:declarationId/validate`
- `POST /sence/declarations/:declarationId/evidence`
- `POST /sence/declarations/:declarationId/ready`
- `POST /sence/declarations/:declarationId/submit`
- `POST /sence/declarations/:declarationId/status`
- `POST|GET /sence/declarations/:declarationId/documents`
- `GET /training-sessions/:trainingSessionId/sence/declaration`

All non-public SENCE operations use JWT authentication and `sence.*` permissions. The OpenAPI contract documents them as a local foundation.

## Existing State Model

`DRAFT → READY → SUBMITTED` is implemented through dedicated actions. `ACCEPTED`, `REJECTED`, and `OBSERVED` are set through the local manual status action. Submitted records cannot be marked ready. The repository does not synchronize status with an official system and does not preserve submission attempts as separate immutable records.

## Existing Frontend

`frontend/app/sence/page.tsx` provides:

- Declaration list and status filter.
- Local counts, projected tax-credit sum, and missing-evidence count.
- Evidence checklist derived from client-side module lists.
- Create, validate, mark-ready, and submit actions.
- Explicit UI text that the workflow is not an official automatic submission.

The screen selects the first declaration/session for its checklist and is not a complete regulatory case workspace.

## Existing Validation

The domain validator checks:

- Training session and course existence/status.
- At least one participant.
- Attendance presence for declared participant states.
- Certificate presence for a participant with calculated attendance at or above 75%.
- Evaluation presence as a warning.
- Cross-tenant inconsistencies.

Limitations:

- One attendance record is sampled per enrollment.
- A fixed 75% threshold is used and does not account for modality-specific rules.
- No participant eligibility, employment relationship, salary band, contribution, pre/post-contract, official course validity, LCE, connectivity, invoice, or affidavit rule exists.

## Existing Audit

SENCE create, update, validation, evidence build, ready, submit, status update, and document attachment write AuditEvent records. Audit failure/transactional atomicity, correlation IDs, querying, retention, export, and tamper resistance are incomplete.

## Existing Tests

`src/modules/sence/sence.test.ts` contains 15 passing module tests covering creation, validation success/failure, warnings, evidence, ready/submit/status transitions, documents, tenant isolation, and session lookup. The broader repository contains security and commercial PostgreSQL E2E suites. Numerical coverage is not configured.

## Simulated or Stubbed Behavior

- SENCE submission is explicitly `MANUAL_STUB`.
- Certificate document generation uses local stub metadata.
- Password email uses a console stub.
- Certificate preview contains a visual QR placeholder.

## Not Implemented

- OTEC profile, RUDO record, NCh2728 validity, offices, legal representatives, or resolutions.
- Official communication, rectification, annulment, pre-liquidation, or liquidation.
- SENCE, RUDO, OTIC, LCE, electronic-signature, or e-learning-control connectors.
- Regulatory document repository, affidavits, official attendance certificates, invoice/payment evidence, or retention packages.
- Notification delivery, regulatory deadlines, reconciliation, retries, idempotency, or outbox.

## Reusable Foundations

- Modular Clean Architecture folder convention.
- Organization type and authenticated tenant context.
- Repository interfaces and Prisma adapters.
- Zod validation, pagination, errors, async HTTP handling, and `/api/v1` versioning.
- `requireAuth`, `requirePermission`, and permission seeding.
- AuditLogger and AuditEvent persistence.
- RUT and Email value objects.
- Frontend API client, TanStack Query, forms, status badges, dialogs, feedback states, tables, and shell/navigation.

## Components to Extend or Replace

- Extend audit context to support safe correlation and rule-code metadata; make critical writes atomic.
- Introduce real expected-version predicates instead of only incrementing `version`.
- Replace local document stubs with a document bounded context in a later phase.
- Extend SENCE activity preparation through a readiness port, not direct internal imports.
- Replace client-side capped dashboard aggregation with server-side projections in a later phase.
- Keep `MANUAL_STUB` until supported external contracts and durable integration infrastructure exist.

## Principal Risks

1. Regulatory misrepresentation if local readiness is presented as official accreditation.
2. Mutable rules becoming hardcoded or stale.
3. Cross-tenant leakage through related-record lookup.
4. Lost updates without expected-version persistence.
5. Business success and audit failure becoming inconsistent.
6. Document identifiers being mistaken for verified documentary evidence.
7. Roadmap OpenAPI operations being mistaken for active integrations.

