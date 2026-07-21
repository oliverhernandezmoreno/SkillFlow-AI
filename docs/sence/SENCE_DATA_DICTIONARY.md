# OTEC Compliance Data Dictionary

## Conventions

- All primary identifiers are UUIDs.
- Every tenant-owned record contains `organizationId` and uses tenant-scoped relations.
- Mutable records contain `createdAt`, `updatedAt`, `deletedAt`, and `version`.
- `version` starts at 1 and is checked in mutation predicates.
- Date-time values use UTC timestamps; business effective-date semantics must be explicit.
- Derived expiration classifications are not persisted.
- Document identifiers establish a reference only, not authenticity.

## TenantModuleEntitlement

| Field | Type | Required | Rules |
|---|---|---:|---|
| id | UUID | Yes | Primary key |
| organizationId | UUID | Yes | Authenticated tenant scope |
| moduleCode | enum/string | Yes | `OTEC_COMPLIANCE` in this phase |
| status | enum | Yes | ENABLED, DISABLED, SUSPENDED, EXPIRED, PLAN_RESTRICTED |
| enabledFeatures | string[]/JSON | Yes | Empty means no feature overrides unless contract defines all-enabled |
| validFrom | DateTime? | No | Effective availability start |
| validUntil | DateTime? | No | Effective availability end |
| restrictionReason | string? | No | Safe operational explanation |
| audit fields | standard | Yes | Soft delete/version apply |

Active uniqueness: one non-deleted entitlement per organization/module code.

## OtecComplianceSettings

| Field | Type | Required | Rules |
|---|---|---:|---|
| id | UUID | Yes | Primary key |
| organizationId | UUID | Yes | Tenant scope |
| otecProfileId | UUID | Yes | Same-tenant profile |
| effectiveFrom/effectiveTo | DateTime | Yes/No | Version applicability |
| requireNch2728 | Boolean | Yes | Configurable; not an official assertion |
| requiredResolutionTypes | string[]/JSON | Yes | Never hardcoded in evaluator |
| qualifyingOfficeTypes | string[]/JSON | Yes | Requires functional validation |
| expirationWarningDays | int[]/JSON | Yes | Default 7, 15, 30, 60 |
| undatedRecordTreatment | enum | Yes | BLOCKING, WARNING, ACCEPTED |
| sourceReference/sourceVersion | string? | No | Traceability |
| validationStatus | enum | Yes | Requires functional validation by default |
| audit fields | standard | Yes | Versioned settings |

## OtecProfile

| Field | Type | Required | Rules |
|---|---|---:|---|
| id | UUID | Yes | Aggregate ID |
| organizationId | UUID | Yes | Organization must be active/type OTEC |
| registrationCode | string? | No | Syntactic value only; no online validation |
| registrationStatus | enum | Yes | Internal vocabulary pending functional validation |
| rudoReference | string? | No | Reference only |
| accreditationState | enum/string | No | Prefer derived summary; persist only if independent behavior is validated |
| accreditationDate/suspensionDate/cessationDate | DateTime? | No | Must be chronologically coherent |
| technicalContactName | string? | No | Data minimization applies |
| technicalContactEmail | Email? | No | Reuse Email validation |
| technicalContactPhone | string? | No | Syntax validation; no regulatory meaning |
| notes | string? | No | Length-limited; no secrets/sensitive documents |
| audit fields | standard | Yes | One active profile per tenant through partial unique index |

Legal name, business name, and tax ID remain on Organization and are exposed via a read port.

## OtecAccreditation

| Field | Type | Required | Rules |
|---|---|---:|---|
| id, organizationId, otecProfileId | UUID | Yes | Same-tenant relationship |
| accreditationType | string/enum | Yes | Configurable vocabulary |
| accreditationNumber | string | Yes | Tenant-scoped active uniqueness where applicable |
| status | enum | Yes | DRAFT, ACTIVE, SUSPENDED, REVOKED, CANCELLED; expiry derived |
| issuedAt | DateTime? | No | Cannot prove official issue |
| validFrom/validUntil | DateTime? | No | Ordered range; undated treatment configured |
| suspendedAt/revokedAt | DateTime? | No | Required by matching transition when applicable |
| issuingAuthority | string? | No | Reference text |
| source/externalReference | string? | No | Manual/internal source identified |
| notes | string? | No | Length and PII limits |
| audit fields | standard | Yes | Expected-version updates |

## QualityCertification

| Field | Type | Required | Rules |
|---|---|---:|---|
| id, organizationId, otecProfileId | UUID | Yes | Same tenant |
| certificationType | enum | Yes | NCH_2728, ISO_9001, OTHER |
| certificationNumber | string | Yes | Tenant-scoped active uniqueness where applicable |
| certifyingEntity | string | Yes | Reference only |
| scope | string? | No | Human-readable certified scope |
| issuedAt, validFrom, validUntil | DateTime? | No | Date-range rule applies |
| status | enum | Yes | DRAFT, ACTIVE, SUSPENDED, REVOKED, CANCELLED |
| documentId | UUID? | No | Same-tenant ownership check |
| notes, audit fields | standard | No/Yes | Versioned/soft-deleted |

## OtecOffice

| Field | Type | Required | Rules |
|---|---|---:|---|
| id, organizationId, otecProfileId | UUID | Yes | Same tenant |
| officeCode | string | Yes | Active tenant/profile uniqueness |
| name | string | Yes | Display name |
| officeType | enum | Yes | HEADQUARTERS, BRANCH, OPERATING_OFFICE, TRAINING_SITE, OTHER |
| status | enum | Yes | DRAFT, ACTIVE, INACTIVE, SUSPENDED, CLOSED |
| street, city, commune, region | string | Yes | Chilean address components; validate length |
| country | string | Yes | Defaults to CL, not hardcoded as invariant |
| postalCode, email, phone | string? | No | Syntax validation |
| validFrom/validUntil | DateTime? | No | Effective range |
| notes, audit fields | standard | No/Yes | Versioned/soft-deleted |

## LegalRepresentative

| Field | Type | Required | Rules |
|---|---|---:|---|
| id, organizationId, otecProfileId | UUID | Yes | Same tenant |
| firstName, lastName | string | Yes | Required; avoid duplication in audit metadata |
| taxId | RUT | Yes | Reuse RUT value object; mask in logs/audit metadata |
| email, phone | string? | No | Syntax/data minimization |
| roleTitle | string | Yes | Internal display/reference |
| validFrom/validUntil | DateTime? | No | Effective range |
| active | Boolean | Yes | Must also be effective to satisfy readiness |
| appointmentDocumentId | UUID? | No | Same-tenant ownership check |
| notes, audit fields | standard | No/Yes | Versioned/soft-deleted |

## OtecResolution

| Field | Type | Required | Rules |
|---|---|---:|---|
| id, organizationId, otecProfileId | UUID | Yes | Same tenant |
| resolutionType | enum/string | Yes | ACCREDITATION, AUTHORIZATION, MODIFICATION, SUSPENSION, CESSATION, OTHER; requirement is configured |
| resolutionNumber | string | Yes | Tenant/profile active uniqueness where applicable |
| issuingAuthority | string | Yes | Reference only |
| issuedAt | DateTime | Yes | Administrative issue date |
| validFrom/validUntil | DateTime? | No | Effective range |
| status | enum | Yes | DRAFT, ACTIVE, INACTIVE, SUSPENDED, CANCELLED, SUPERSEDED |
| scope | string? | No | Length-limited |
| supersedesResolutionId | UUID? | No | Same tenant/profile; no self-reference or cycle |
| documentId | UUID? | No | Same-tenant ownership check |
| notes, audit fields | standard | No/Yes | Versioned/soft-deleted |

## OtecReadinessResult (Not Persisted as Master Data)

| Field | Type | Meaning |
|---|---|---|
| status | enum | READY, READY_WITH_WARNINGS, NOT_READY |
| evaluatedAt | ISO date-time | Injected/current evaluation instant |
| score | integer 0–100 | Informational; cannot override blockers |
| blockingIssues/warnings/passedChecks | Check[] | Applicable categorized results |
| expiringItems/missingItems | Check[] | Convenience projections |

Each Check contains `ruleCode`, `entityType`, optional `entityId`, `severity`, `message`, optional `validFrom`, `validUntil`, `daysUntilExpiration`, and `remediation`.

## Index and Integrity Plan

- Index every `organizationId`, `otecProfileId`, `status`, `validUntil`, and `deletedAt` used by filters.
- Add composite tenant/status and tenant/validUntil indexes for readiness and expiration queries.
- Add partial unique indexes for non-deleted active profile and applicable business identifiers.
- Use composite tenant foreign keys where Prisma supports them; otherwise enforce same-tenant references transactionally and test them.
- Never update by ID alone; use tenant and expected version.

