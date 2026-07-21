# SENCE Process Map

## Scope

This map separates the future operational lifecycle into bounded stages. Phase 1 implements only Stage A and the internal readiness gate preceding Stage C. Other stages are documented for dependency planning and must not be presented as implemented.

| Stage | Primary actor | Input | Action | Result/state | Evidence | Rule/exception | Dependency | Future automation |
|---|---|---|---|---|---|---|---|---|
| A. OTEC configuration | Organization Admin / Compliance Manager | Organization, profile, accreditation, certification, office, representative, resolutions | Maintain internal regulatory antecedents and evaluate dates | READY / READY_WITH_WARNINGS / NOT_READY | Versioned records and audit events | Configurable foundation rules; unresolved interpretations remain unvalidated | Organizations, entitlement, audit, optional documents | RUDO lookup and expiry notifications only after supported contracts |
| B. Regulatory course catalog | Course Manager / Compliance Manager | Course definition, modality, duration, code, authorization evidence | Validate regulatory catalog metadata | Course internally eligible/ineligible | Course version and documents | Modality/code validity rules require validation | Courses, documents | Official catalog/code verification if supported |
| C. Activity preparation | OTEC Operator | Ready OTEC, eligible course, proposed delivery | Create regulatory activity draft | DRAFT / VALIDATION_PENDING | Activity snapshot | OTEC readiness must not be NOT_READY | OTEC Compliance, courses, sessions | Pre-fill official communication payload |
| D. Participant selection | OTEC Operator / Employer | Candidate participants and employment data | Enroll and validate eligibility | Eligible/ineligible participant set | Participant snapshot and reasons | Contract/franchise rules require validation | Employees, enrollments, employer data | HRIS/payroll validation |
| E. Block planning | Coordinator / Instructor | Activity, modality, hours, venue | Define class blocks and attendance windows | Planned blocks | Timetable/version | Total hours and modality constraints | Sessions, instructors, offices | Calendar/resource conflict detection |
| F. Execution | Instructor / Coordinator | Approved plan and participants | Deliver blocks and record incidents/content | IN_EXECUTION → EXECUTED | Class records and content evidence | Exceptions for reschedule/cancellation | Blocks, notifications | Instructor/participant portals |
| G. Attendance | Instructor / Participant | Block, participant identity | Capture and validate attendance | Complete/incomplete evidence | Attendance, signatures/device data | Modality-specific rules | Attendance, documents, LCE | LCE/offline/device adapters |
| H. Evaluations | Instructor / Evaluator | Assessment policy and responses | Diagnose, assess, score, close | Results/pass/fail | Evaluation versions and responses | Attempt/grading rules | Evaluations, attendance | Proctoring/manual review |
| I. Certification | Authorized issuer | Completion, attendance, evaluation | Determine eligibility and issue artifact | ISSUED / REVOKED | Signed certificate and verification | Versioned certificate rules | Certificates, documents, signature | Rendering, QR, signature, delivery |
| J. Document dossier | Compliance Manager / Auditor | All required evidence | Assemble, validate, freeze, retain | Complete/incomplete dossier | Manifest, checksums, versions | Document matrix by modality/process | Document platform | Automated completeness and retention |
| K. Communication preparation | Compliance Manager | Valid activity and dossier subset | Build and review external payload | READY_TO_COMMUNICATE | Immutable payload snapshot | External contract/version | Activity, dossier | Connector-ready message/outbox |
| L. Manual follow-up | OTEC Operator | Manually communicated reference | Record external folio/status/timestamps | COMMUNICATED_MANUALLY | Receipt/reference | Manual verification | Audit | Reconciliation workflow |
| M. Observations | Compliance Manager | External/internal observation | Record structured issue and deadline | OBSERVED / RECTIFICATION_REQUIRED | Observation evidence | Severity/deadline rules | Notifications, audit | Inbound status synchronization |
| N. Rectification | Authorized operator/approver | Observation and corrected data | Create correction version and submit manually/externally | RECTIFIED | Before/after payload and approval | Cannot erase prior version | Dossier, communication | Connector retry/reconciliation |
| O. Annulment | Authorized approver | Reason, eligibility, external state | Request/record annulment | ANNULLED | Reason, approval, receipt | Allowed-state rules | Audit, integration | Official annulment connector |
| P. Pre-liquidation | Finance/Compliance | Executed activity, dossier, cost evidence | Validate pre-liquidation package | READY_FOR_PRELIQUIDATION / PRELIQUIDATED | Financial/document manifest | Modality/process rules | Finance, documents, attendance | External pre-liquidation adapter |
| Q. Liquidation | Finance/Compliance/External party | Accepted pre-liquidation package | Submit/record final liquidation | READY_FOR_LIQUIDATION / LIQUIDATED / REJECTED | Receipt, amounts, decision | Deadlines and reconciliation | Finance, OTIC/SENCE, audit | Durable connector and reconciliation |

## Phase 1 Boundary

Phase 1 completes these internal actions only:

1. Confirm tenant module entitlement.
2. Confirm Organization is internally typed as OTEC.
3. Maintain profile and regulatory antecedents.
4. Evaluate effective rules and expirations.
5. Return internal readiness and remediation evidence.
6. Allow or deny beginning future activity preparation through a port.

It does not create the future regulatory activity aggregate or perform Stages B–Q.

## Cross-Cutting Exceptions

- Cross-tenant references are always rejected without disclosure.
- Stale versions cause conflict and no mutation.
- Missing official integration is never treated as successful validation.
- Unvalidated regulatory interpretations are configured and labeled, not asserted.
- Critical audit failure is not hidden.
- Document absence/presence is distinguished from authenticity verification.

