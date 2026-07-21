## ADDED Requirements

### Requirement: OTEC profile eligibility
The system SHALL allow creation of one active OTEC profile only when the authenticated organization is active and has organization type `OTEC`.

The current OTEC profile SHALL be treated as a tenant-scoped singleton defined as the one profile whose status is `ACTIVE` and whose `deletedAt` is null. Application profile read, update, and deactivation operations SHALL resolve that current profile only from the authenticated `UseCaseContext.organizationId` and SHALL NOT require a caller-supplied profile identifier.

#### Scenario: OTEC organization creates profile
- **WHEN** an entitled tenant of type `OTEC` submits valid profile data and has no active profile
- **THEN** the system creates a tenant-scoped active OTEC profile and records an audit event

#### Scenario: Non-OTEC organization creates profile
- **WHEN** an organization whose type is not `OTEC` attempts to create an OTEC profile
- **THEN** the system rejects the operation without creating data

#### Scenario: Duplicate active profile
- **WHEN** a tenant with an active OTEC profile attempts to create another active profile
- **THEN** the system rejects the operation as a conflict

#### Scenario: Resolve the tenant profile singleton

- **WHEN** an authorized tenant reads, updates, or deactivates its current OTEC profile
- **THEN** application resolves the unique active non-deleted profile by authenticated organization identifier
- **AND** no profile or organization identifier is accepted as operation input

#### Scenario: Historical profile is not current

- **WHEN** a tenant has only an inactive or soft-deleted historical profile
- **THEN** current-profile read, update, and deactivation return the existing non-disclosing not-found error
- **AND** profile creation may create a new active profile under the existing partial-uniqueness rule

#### Scenario: Impossible current-profile cardinality

- **WHEN** persistence returns more than one active non-deleted profile for one organization despite the database invariant
- **THEN** the repository raises a safe internal integrity failure
- **AND** it does not select a record by ordering or heuristic

### Requirement: Regulatory record management
The system SHALL manage tenant-scoped accreditations, quality certifications, offices, legal representatives, and resolutions as children of an active OTEC profile.

#### Scenario: Create valid regulatory record
- **WHEN** an authorized user submits valid data for a supported regulatory record type
- **THEN** the system creates the record under the authenticated tenant and profile with version 1

#### Scenario: Invalid date range
- **WHEN** `validFrom` is later than `validUntil`
- **THEN** the system rejects the record as invalid input

#### Scenario: Cross-tenant parent reference
- **WHEN** a record references a profile or related record owned by another tenant
- **THEN** the system rejects the operation without disclosing the foreign record

### Requirement: Explicit lifecycle transitions
The system SHALL use explicit application actions for suspension, revocation, deactivation, and resolution supersession when those changes carry domain meaning.

#### Scenario: Suspend accreditation
- **WHEN** an authorized user suspends an active accreditation with the expected version
- **THEN** the accreditation becomes suspended, its version advances, and before/after audit evidence is recorded

#### Scenario: Supersede resolution
- **WHEN** an authorized user supersedes a resolution with another active same-tenant resolution and no cycle is introduced
- **THEN** the relationship is stored and the superseded resolution no longer satisfies active readiness requirements

#### Scenario: Supersession cycle
- **WHEN** a requested supersession would create a direct or indirect cycle
- **THEN** the system rejects the transition

### Requirement: Document tenant ownership
The system MUST validate through a document-ownership port that any supplied document identifier belongs to the authenticated tenant.

#### Scenario: Foreign document
- **WHEN** a certification, representative, or resolution supplies a document identifier owned by another tenant
- **THEN** the system rejects the operation and stores no reference

#### Scenario: Document service unavailable
- **WHEN** no document identifier is required and the document module is unavailable
- **THEN** the record can be stored without claiming documentary verification

### Requirement: Real optimistic concurrency
The system MUST include the expected version in every mutable repository predicate and SHALL return HTTP 409 when no current record matches it.

#### Scenario: Current version update
- **WHEN** an update supplies the persisted current version
- **THEN** exactly one tenant-scoped record is updated and its version increments atomically

#### Scenario: Stale version update
- **WHEN** an update supplies a stale version
- **THEN** no record is changed, a conflict is returned, and the conflict attempt is audited without sensitive data

### Requirement: Soft deletion and active uniqueness
The system SHALL retain deactivated records through soft deletion and SHALL enforce uniqueness only among records that are active where business reuse is valid.

#### Scenario: Reuse after deactivation
- **WHEN** a uniquely numbered record has been soft-deleted and business rules permit reuse
- **THEN** a new active record may use that number without modifying historical data
