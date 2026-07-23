## ADDED Requirements

### Requirement: Consistent authenticated workspace shell
Every OTEC Compliance route SHALL render inside the same authenticated application shell, including the sidebar, top bar, responsive content width, spacing, and theme styles.

#### Scenario: Navigate between OTEC Compliance sections
- **WHEN** an authenticated user navigates from Profile to Accreditations, Quality Certifications, Offices, Legal Representatives, Resolutions, or Readiness
- **THEN** the application shell remains visible and only the OTEC Compliance page content changes

### Requirement: Connected OTEC Compliance workspace
The frontend SHALL provide a Settings → OTEC Compliance workspace backed by the implemented API and SHALL not use static regulatory data.

#### Scenario: Ready summary
- **WHEN** the API returns `READY`
- **THEN** the summary displays the ready state, passed checks, active antecedent counts, and no official-integration claim

#### Scenario: Blocking summary
- **WHEN** the API returns `NOT_READY`
- **THEN** the workspace displays blocking issues, missing items, and remediation guidance

#### Scenario: Empty tenant
- **WHEN** an entitled tenant has no OTEC profile
- **THEN** the workspace displays an empty state with the authorized profile setup action

### Requirement: Regulatory record workflows
The frontend SHALL provide accessible, responsive forms and lists for profile, accreditations, certifications, offices, legal representatives, resolutions, and expirations.

#### Scenario: Invalid form
- **WHEN** a user submits an invalid date range or required field is missing
- **THEN** client validation identifies the affected fields and no request is sent

#### Scenario: Forbidden response
- **WHEN** the API returns HTTP 403
- **THEN** the page displays a forbidden state without exposing management controls

#### Scenario: Version conflict
- **WHEN** the API returns HTTP 409
- **THEN** the page explains that data changed, preserves safe user input, and offers a reload action

### Requirement: Critical transition confirmation
The frontend MUST require confirmation before suspension, revocation, deactivation, or resolution supersession.

#### Scenario: Cancel transition confirmation
- **WHEN** the user cancels a destructive-transition confirmation
- **THEN** no mutation request is sent

### Requirement: Expiration visualization
The frontend SHALL distinguish expired, expiring soon, undated, suspended, revoked, ready-with-warnings, and missing states.

#### Scenario: Item expiring soon
- **WHEN** an item is within an effective configured warning window
- **THEN** the workspace displays its expiration date, days remaining, and warning state

### Requirement: Module-unavailable frontend state
The frontend SHALL render disabled, suspended, expired, and plan-restricted module outcomes without treating them as generic server errors.

#### Scenario: Suspended module
- **WHEN** the entitlement service reports the module suspended
- **THEN** the workspace displays a non-destructive suspended-module message and no data-management actions
