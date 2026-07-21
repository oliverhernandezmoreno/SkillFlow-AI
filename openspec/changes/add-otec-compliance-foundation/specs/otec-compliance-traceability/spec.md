## ADDED Requirements

### Requirement: Sensitive operation audit
The system SHALL persist audit evidence for regulatory-record creation and changes, lifecycle transitions, readiness evaluations, relevant denied attempts, and optimistic-concurrency conflicts.

#### Scenario: Successful critical mutation
- **WHEN** an authorized user changes an accreditation status
- **THEN** the audit record includes tenant, actor, entity, action, timestamp, IP, user agent, safe before/after values, metadata, correlation identifier, and applicable rule codes

#### Scenario: Audit failure on critical operation
- **WHEN** critical audit persistence fails
- **THEN** the operation does not silently report success and follows the documented transactional failure strategy

### Requirement: Audit data minimization
The system MUST avoid complete RUT values, document bodies, secrets, and unnecessary personal data in operational logs and audit metadata.

#### Scenario: Representative update audit
- **WHEN** a legal representative is updated
- **THEN** audit evidence identifies changed fields without storing an unmasked RUT in general metadata

### Requirement: OpenAPI implementation truth
The OpenAPI contract SHALL describe every implemented endpoint, permission, request, response, error, pagination rule, example, and implementation status.

#### Scenario: External-integration disclaimer
- **WHEN** a consumer reads an OTEC Compliance operation
- **THEN** its description states that Phase 1 performs internal configuration only and does not query or communicate with official systems

### Requirement: Regulatory source traceability
Regulatory rules SHALL have versionable metadata including source reference, source version, effective period, validation status, configuration key, and behavioral test cases.

#### Scenario: Unvalidated rule
- **WHEN** a rule has not received functional validation
- **THEN** it is marked as requiring validation and is not represented as an official rule

### Requirement: Implementation verification record
The change SHALL include Phase 0 documentation, RBAC matrix, implementation report, quality-command results, available coverage evidence, database-state verification, manual endpoint results, frontend E2E results when tooling is available, limitations, risks, and explicit non-goals.

#### Scenario: Phase completion review
- **WHEN** Phase 1 is proposed as complete
- **THEN** reviewers can trace every acceptance criterion to a specification, implementation artifact, test, and verification result

