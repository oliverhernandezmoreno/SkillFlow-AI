## ADDED Requirements

### Requirement: Tenant-scoped module entitlement
The system SHALL evaluate the authenticated tenant's `OTEC_COMPLIANCE` entitlement before executing any OTEC Compliance endpoint.

#### Scenario: Enabled module
- **WHEN** an authenticated tenant has an enabled and currently effective OTEC Compliance entitlement
- **THEN** the request proceeds to feature, permission, and domain validation

#### Scenario: Disabled module
- **WHEN** an authenticated tenant has a disabled, suspended, expired, or missing OTEC Compliance entitlement
- **THEN** the system rejects the request with the documented module-unavailable error without disclosing another tenant's configuration

### Requirement: Reusable entitlement contract
The system SHALL expose module availability through a reusable domain-facing contract that is independent from billing plans.

#### Scenario: Plan restriction
- **WHEN** an entitlement is marked plan-restricted
- **THEN** the service returns a restricted outcome without implementing payment or billing behavior

### Requirement: Tenant isolation for entitlements
The system MUST scope every entitlement read and write to the authenticated organization.

#### Scenario: Cross-tenant entitlement access
- **WHEN** a tenant attempts to address or infer another tenant's module entitlement
- **THEN** the system returns the repository-standard non-disclosure response and no cross-tenant record

