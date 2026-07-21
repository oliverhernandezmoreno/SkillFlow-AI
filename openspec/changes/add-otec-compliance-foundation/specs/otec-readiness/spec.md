## ADDED Requirements

### Requirement: Internal OTEC readiness evaluation
The system SHALL evaluate internal OTEC readiness at a requested evaluation date and return `READY`, `READY_WITH_WARNINGS`, or `NOT_READY` with rule-level evidence.

#### Scenario: All blocking requirements pass
- **WHEN** an OTEC tenant has an active profile, current active accreditation, required current NCh2728 certification, active office, current active legal representative, and all configured required resolutions
- **THEN** the evaluator returns `READY` unless an item falls within a configured warning window

#### Scenario: Upcoming expiration
- **WHEN** all blocking requirements pass and at least one applicable item expires within a configured warning window
- **THEN** the evaluator returns `READY_WITH_WARNINGS` with the expiring item and days remaining

#### Scenario: Blocking requirement fails
- **WHEN** any blocking rule fails
- **THEN** the evaluator returns `NOT_READY` regardless of its numerical score

### Requirement: Configurable regulatory rules
The system SHALL evaluate versioned rule configuration rather than hardcoding mutable regulatory requirements or dates.

#### Scenario: NCh2728 required
- **WHEN** the effective tenant configuration requires NCh2728 and no current active certification exists
- **THEN** rule `OTEC-QUAL-001` produces a blocking issue

#### Scenario: NCh2728 not required
- **WHEN** the effective tenant configuration does not require NCh2728
- **THEN** absence of NCh2728 does not block readiness and the result identifies the rule as not applicable

#### Scenario: Required resolution types
- **WHEN** configuration lists required resolution types
- **THEN** only those effective types are evaluated for rule `OTEC-RES-001`

### Requirement: Evidence-rich readiness result
Every applicable check result SHALL include rule code, entity type, entity identifier when present, severity, message, relevant validity dates, days until expiration when calculable, and remediation guidance.

The readiness result SHALL identify the evaluated organization and OTEC profile, evaluation timestamp, effective policy version, all findings, blocking findings, warnings, and passed rules. It SHALL describe internal preparation readiness only and SHALL NOT claim official validation or approval.

#### Scenario: Missing accreditation
- **WHEN** no current active accreditation exists
- **THEN** the result includes `OTEC-ACC-001` in `blockingIssues` and `missingItems` with remediation guidance

#### Scenario: Explainable result metadata
- **WHEN** readiness is evaluated for an authorized tenant profile
- **THEN** every finding includes a stable code, category, severity, evaluation timestamp, entity reference when applicable, and remediation
- **AND** the result includes organization, profile, and effective policy identifiers

### Requirement: Historical evaluation
The system SHALL evaluate date-effective records and rule configuration using an explicitly supplied evaluation date or the current time when omitted.

#### Scenario: Historical readiness
- **WHEN** an authorized user evaluates a past date
- **THEN** the result reflects records and rules effective on that date without changing current data

#### Scenario: Inclusive validity boundaries
- **WHEN** the evaluation date equals `validFrom` or `validUntil`
- **THEN** that boundary is considered effective
- **AND** regulatory `DATE` values are compared as UTC calendar days
- **AND** the record becomes ineffective on the calendar day after `validUntil`

#### Scenario: Configured undated treatment
- **WHEN** an otherwise active record has an open validity boundary
- **THEN** `BLOCKING`, `WARNING`, or `ACCEPTED` behavior follows the effective tenant policy without hardcoded regulatory interpretation

### Requirement: Tenant-scoped consistent readiness snapshot
The application SHALL compose readiness from one authorized tenant and profile using soft-delete-aware reads and an effective policy selected at the evaluation date.

#### Scenario: Foreign and deleted evidence
- **WHEN** valid-looking evidence belongs to another tenant or is soft-deleted
- **THEN** it is absent from the evaluated snapshot, does not affect readiness, and is not disclosed in findings

#### Scenario: Consistent multi-aggregate read
- **WHEN** the application loads organization, profile, policy, and regulatory evidence
- **THEN** infrastructure performs a bounded consistent read without importing Prisma into application or domain code

### Requirement: Configurable expiration queries
The system SHALL list expired, undated, suspended, revoked, and upcoming-expiration records using configurable windows that include 7, 15, 30, and 60 days by default.

#### Scenario: Expiration window query
- **WHEN** a user requests records expiring within 30 days
- **THEN** only same-tenant effective records within that window are returned with pagination and expiration metadata

#### Scenario: Deterministic exceptional-state listing
- **WHEN** exceptional records include expired, undated, suspended, revoked, and expiring-soon evidence
- **THEN** the query excludes soft-deleted, foreign, inactive, cancelled, draft, and superseded evidence
- **AND** returns a deterministic validity/category/identifier order with typed pagination

### Requirement: Compliance summary projection
The system SHALL expose an application-level summary projected from the consolidated readiness result without reimplementing regulatory rules.

#### Scenario: Summary projection
- **WHEN** an authorized tenant requests its profile summary at an evaluation date
- **THEN** the result includes readiness status, evaluated timestamp, policy version, blocking count, warning count, passed rule count, missing item count, and expiring item count
- **AND** contains no Prisma model or official-validation claim

### Requirement: Activity preparation gate
The system SHALL expose an internal validation that allows SENCE activity preparation only when readiness is not `NOT_READY`.

#### Scenario: Ready tenant validates preparation
- **WHEN** the current readiness result is `READY` or `READY_WITH_WARNINGS`
- **THEN** the validation permits internal preparation and returns evaluated rule evidence

#### Scenario: Blocked tenant validates preparation
- **WHEN** the current readiness result is `NOT_READY`
- **THEN** the validation denies preparation and returns the blocking rule codes without claiming official non-compliance

### Requirement: Query projection consolidation
Separate findings and blocking-item application use cases SHALL NOT duplicate readiness evaluation when the consolidated readiness result already exposes those projections.

#### Scenario: Findings consumer
- **WHEN** a future delivery adapter needs all findings or only blocking findings
- **THEN** it projects `findings` or `blockingIssues` from `EvaluateOtecReadiness` rather than invoking duplicate domain rules
