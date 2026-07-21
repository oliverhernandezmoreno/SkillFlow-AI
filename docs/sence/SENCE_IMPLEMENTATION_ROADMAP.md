# SENCE and OTEC Implementation Roadmap

## Guiding Principle

Build reliable internal records, evidence, security, and operations before introducing external communication. No stage may claim official integration without supported technical and contractual evidence.

## Phase 0 — Specification (Current)

**Outcome:** Evidence-based current state, shared glossary, process and state models, rule catalog, document/data matrices, traceability, roadmap, and architecture.

**Exit criteria:**

- Ten required documents exist and agree with OpenSpec artifacts.
- Regulatory assumptions are labeled by validation status.
- Phase 1 requirements and tests are traceable.
- Human decisions are configured or explicitly pending.

## Phase 1 — OTEC Compliance Foundation (Approved Scope)

**Outcome:** A tenant can maintain internal OTEC antecedents and receive an evidence-rich internal readiness result.

**Capabilities:**

- Tenant module entitlement.
- OTEC profile.
- Accreditations.
- Quality certifications including NCh2728 as a configurable requirement.
- Offices.
- Legal representatives.
- Resolutions and supersession.
- Effective-dated rule configuration.
- Readiness, summary, expiration queries, and activity-preparation gate.
- RBAC, audit, optimistic concurrency, OpenAPI, frontend workspace, and fictitious seed.

**Explicit exclusions:** Official integrations, activity communication, LCE, document platform, notifications, liquidation, finance, signatures, biometrics, and e-learning control.

## Phase 2 — Regulatory Activity and Document Foundation

**Prerequisites:** Phase 1 operational proof, document architecture approval, and validated activity requirements.

**Candidate scope:**

- RegulatoryActivity aggregate and immutable versions.
- Course regulatory authorization/version metadata.
- Class blocks and attendance windows.
- Participant eligibility snapshots and rule results.
- First-class document bounded context with secure storage, scanning, checksums, review, version, expiry, and retention.
- Structured dossier manifests and completeness evaluation.
- Observation and remediation task model.
- Transactional outbox and durable jobs.
- Notification abstraction without implying regulatory delivery.

## Phase 3 — Execution Evidence

**Prerequisites:** Validated modality rules and evidence matrix.

**Candidate scope:**

- Class book and content delivery records.
- Correctable but auditable class/attendance workflows.
- QR with signed, expiring, replay-protected tokens.
- Digital-signature provider abstraction.
- Offline/device workflows where justified.
- E-learning connectivity evidence model.
- Evaluation policies and immutable closed results.
- Real certificate PDF, QR, signing, storage, download, delivery, and revocation evidence.

LCE, biometrics, or official e-learning adapters remain separate decisions requiring supported interfaces and privacy/security review.

## Phase 4 — Communication and Reconciliation

**Prerequisites:** Confirmed external contracts, security review, outbox/jobs, idempotency, document evidence, and operational support.

**Candidate scope:**

- Versioned connector contracts.
- Communication payload snapshots and approvals.
- Manual and supported-external communication modes clearly distinguished.
- External folio/status history.
- Retry, circuit breaker, idempotency, dead-letter, reconciliation, and operator recovery.
- Observations, rectifications, annulment, and immutable attempt history.
- Monitoring, alerting, audit export, and integration runbooks.

## Phase 5 — Pre-Liquidation, Liquidation, and OTIC/Finance

**Prerequisites:** Validated process rules and external responsibilities.

**Candidate scope:**

- Cost/invoice/payment evidence.
- Pre-liquidation and liquidation package state machines.
- OTIC relationships and settlement workflows.
- Tax-franchise eligibility/calculation only with validated rules and source versions.
- Financial reconciliation, approval, exceptions, and reports.

## Phase 6 — Enterprise Scale and Intelligence

- SSO/MFA/SCIM and access reviews.
- Database-level tenant controls and data-governance automation.
- Multi-region/DR if customer requirements justify it.
- Compliance analytics and anomaly detection.
- AI assistance only with governed datasets, human review, traceability, evaluation, privacy, and cost controls.

## Cross-Phase Gates

Every phase requires:

1. Versioned, source-linked, functionally validated rules.
2. Tenant-isolation and authorization evidence.
3. Expected-version/idempotency behavior for sensitive writes.
4. Audit completeness and data minimization.
5. Automated tests, database verification, manual endpoint evidence, and browser E2E where applicable.
6. OpenAPI/route truth and explicit integration status.
7. Observability and operational recovery proportional to risk.
8. No prohibited official-validation language without evidence.

