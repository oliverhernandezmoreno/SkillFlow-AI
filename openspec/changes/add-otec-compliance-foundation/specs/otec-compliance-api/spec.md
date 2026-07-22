## ADDED Requirements

### Requirement: Versioned protected API
The system SHALL expose the OTEC Compliance HTTP surface under `/api/v1/otec-compliance` and SHALL authenticate every endpoint.

#### Scenario: Missing token
- **WHEN** a client calls an OTEC Compliance endpoint without a valid access token
- **THEN** the system returns HTTP 401

#### Scenario: Missing permission
- **WHEN** an authenticated user lacks the endpoint's required OTEC Compliance permission
- **THEN** the system returns HTTP 403

### Requirement: Tenant-scoped JWT permissions

The login flow MUST resolve permission claims by authenticated user and organization, include only permissions connected through active user-role, role-permission, role, and permission records in that organization, and remove duplicate codes before token creation.

#### Scenario: Permission belongs to the authenticated organization
- **WHEN** an active user role and role permission in the authenticated organization grant `otec_compliance.profile.manage`
- **THEN** the access and refresh JWT claims include `otec_compliance.profile.manage`

#### Scenario: Same user identifier has unrelated tenant grants
- **WHEN** permission joins outside the authenticated organization are considered
- **THEN** those permission codes are excluded from the JWT

#### Scenario: Soft-deleted authorization join
- **WHEN** a user role, role permission, role, or permission is soft-deleted
- **THEN** its permission code is excluded from the JWT

### Requirement: Ordered access checks
The system SHALL validate tenant context, module entitlement, feature access, permission, and domain rules before completing an endpoint operation.

#### Scenario: Module disabled with valid permission
- **WHEN** a user has the required permission but the tenant module is disabled
- **THEN** the system rejects the request before domain execution

### Requirement: Tenant context is authoritative
The API MUST derive organization identity from authenticated context and MUST NOT accept arbitrary organization filters from ordinary users.

#### Scenario: Organization identifier supplied by client
- **WHEN** an ordinary user supplies an organization identifier in a query or body where it is not part of the public contract
- **THEN** the validator rejects or ignores it according to the documented schema and never changes tenant scope

### Requirement: Validated and paginated contracts
List endpoints SHALL support validated `page`, `pageSize`, `status`, `validFrom`, `validUntil`, `expiringWithinDays`, `search`, and authorized `includeInactive` filters where applicable.

#### Scenario: Invalid filter
- **WHEN** a list request supplies an invalid date, status, page size, or expiration window
- **THEN** the system returns the repository-standard validation response without querying foreign data

### Requirement: Consistent API errors
The API SHALL use one stable error policy. Malformed JSON, headers, parameters, and transport DTOs SHALL return HTTP 400. Syntactically valid application or domain input that fails non-stateful semantic validation SHALL also retain the repository-wide `BadRequestError` HTTP 400 convention. Authentication SHALL return 401; permission or entitlement denial SHALL return 403; missing and cross-tenant resources SHALL return the same non-disclosing 404; active uniqueness, duplicate business identifiers, incompatible lifecycle transitions, singleton conflicts, and optimistic concurrency SHALL return 409; unexpected failures SHALL return a sanitized 500.

HTTP 412 and 422 SHALL NOT be emitted by this module. A valid but stale `If-Match` remains a 409 conflict so one concurrency condition never has two statuses. HTTP 422 remains reserved for a future API-wide versioned policy and SHALL NOT be documented as an implemented response.

#### Scenario: Optimistic concurrency conflict
- **WHEN** a mutation supplies a stale expected version
- **THEN** the system returns HTTP 409 with a safe machine-readable conflict code

#### Scenario: Semantic validation without a state conflict
- **WHEN** a syntactically valid request fails a non-stateful application or domain validation rule
- **THEN** the system returns HTTP 400 with the safe `BAD_REQUEST` code
- **AND** does not return 422

#### Scenario: Valid but stale precondition
- **WHEN** `If-Match` has the approved weak ETag format but does not match the persisted version
- **THEN** the system returns HTTP 409 with the safe `CONFLICT` code
- **AND** does not return 412

### Requirement: No official integration claims
Every API description and readiness response SHALL state that results are internal and do not represent online validation or communication with SENCE, RUDO, OTIC, or LCE.

#### Scenario: Readiness response
- **WHEN** readiness is returned as `READY`
- **THEN** the response describes internal preparation readiness and does not use official accreditation or validation language

### Requirement: Readiness finding public identity

Every readiness finding in the productive HTTP response SHALL expose its stable internal rule identifier as the non-empty string property `code`. The HTTP presenter SHALL NOT expose the internal property name `ruleCode` or provide it as a compatibility alias.

#### Scenario: Internal finding is presented through HTTP

- **WHEN** the application readiness result contains a finding with an internal `ruleCode`
- **THEN** the HTTP response finding contains the same value as `code`
- **AND** the response finding does not contain `ruleCode`
- **AND** the response validates against the approved OpenAPI `ReadinessFinding` schema
## Requirement: Application authorization is transport independent

Every OTEC Compliance application operation SHALL derive tenant and actor identity from `UseCaseContext`, evaluate the effective module entitlement and feature before its declared RBAC permission, and perform tenant-scoped resource access only after both controls pass. Commands SHALL require their aggregate manage permission; ordinary queries SHALL require `otec_compliance.read`; readiness evaluation and activity preparation SHALL require `otec_compliance.readiness.evaluate`. HTTP guards MAY provide defense in depth but SHALL NOT be the only enforcement point.

### Scenario: Entitlement and permission are independent

- **WHEN** a context has the required permission but its tenant entitlement or feature is unavailable
- **THEN** the operation fails with the module-unavailable application error before resource access
- **AND WHEN** entitlement is available but the permission is absent
- **THEN** the operation fails with the forbidden application error before resource access

### Scenario: Profile mutation and audit are atomic

- **WHEN** an OTEC profile command persists a change
- **THEN** persistence and critical audit use the same OTEC Compliance unit of work
- **AND** any audit failure rolls back the profile data and version
## Requirement: HTTP contracts are stabilized before route implementation

The system SHALL define design-only transport contracts for every exposed OTEC Compliance application capability before productive controllers or routes are registered. Transport bodies SHALL be strict, SHALL NOT accept tenant or actor identity, and SHALL keep protected lifecycle transitions outside generic update bodies.

### Scenario: Optimistic concurrency uses one HTTP convention

- **WHEN** an existing versioned resource is mutated
- **THEN** the contract requires `If-Match` in weak ETag form `W/"v<positive integer>"`
- **AND** successful versioned resource responses expose the same form through `ETag`
- **AND** request bodies do not duplicate `expectedVersion`

### Scenario: Contract status follows productive route delivery

- **WHEN** an approved OTEC Compliance operation is productively registered
- **THEN** its OpenAPI operation is marked `implemented`
- **AND** route-drift verification matches its path and method to the productive router
- **AND** internal-only, deferred, superseded, and not-applicable operations remain unregistered and are not documented as productive

## Requirement: Productive HTTP delivery preserves application boundaries

The system SHALL register only approved OTEC Compliance operations under `/api/v1/otec-compliance`. Controllers SHALL validate transport data, derive identity and tenant exclusively from authenticated context, invoke the existing application use case, present the approved response, and apply the approved error and concurrency contracts without importing Prisma or implementing domain rules.

### Scenario: Authenticated productive request

- **WHEN** an authenticated request reaches an implemented OTEC Compliance operation
- **THEN** the application input contains only approved transport fields
- **AND** `organizationId`, actor identity, permissions, IP, user agent, and correlation identifier are derived from trusted request context
- **AND** client-supplied tenant or actor fields are rejected

### Scenario: Versioned productive mutation

- **WHEN** an existing versioned resource is mutated through HTTP
- **THEN** the controller requires and parses `If-Match` as `W/"v<positive integer>"`
- **AND** passes the resulting version only as the application `expectedVersion`
- **AND** returns the resulting resource version through `ETag`
- **AND** stale concurrent requests return the approved safe HTTP 409 response without partial mutation

### Scenario: Productive non-disclosure

- **WHEN** an authenticated tenant addresses a missing or cross-tenant resource
- **THEN** the HTTP response is the same sanitized 404 contract
- **AND** no foreign identifier, tenant metadata, persistence detail, or stack trace is disclosed

### Scenario: Internal-only operation

- **WHEN** productive OTEC Compliance routes are registered
- **THEN** internal activity-preparation validation has no public route
- **AND** no frontend, official-system integration, or unapproved application capability is introduced

## Requirement: Create retry policy is explicit

Every productive create endpoint SHALL document whether an `Idempotency-Key` is required. Phase 1 internal clients MAY create without that header only where active uniqueness or deterministic business conflicts prevent silent duplicate state, or where the residual duplicate risk is explicitly classified before external consumers.

### Scenario: Internal create retry

- **WHEN** an internal client retries a create after an unknown response outcome
- **THEN** active singleton or business-key uniqueness returns the existing safe conflict where available
- **AND** endpoints without complete deterministic uniqueness are classified `REQUIRED_BEFORE_EXTERNAL_CONSUMERS`
- **AND** no persisted idempotency claim is made

### Scenario: Future external consumer

- **WHEN** an external or automated consumer is proposed for any create endpoint
- **THEN** persisted idempotency is implemented under a separately authorized design before that consumer is enabled
