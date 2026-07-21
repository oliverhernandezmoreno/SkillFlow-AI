# OTEC Compliance HTTP Contracts

## Status and Conventions

These contracts describe the **implemented backend HTTP transport**. The existing API server prefix is `/api/v1`; paths below start at `/otec-compliance`. Authentication supplies actor, tenant, permissions, and application entitlement context. Request bodies are strict and never accept `organizationId`, `tenantId`, or `actorId`.

Lists use `page` (default 1) and `pageSize` (default 20, maximum 100), returning `{ data, meta: { page, pageSize, total, totalPages } }`. Dates are ISO 8601; date-only regulatory fields use `YYYY-MM-DD`. Default order remains the deterministic repository/application order.

Existing-resource mutations require `If-Match: W/"vN"`; bodies never contain `expectedVersion`. Versioned responses provide `ETag` in the same form. Stale versions map to 409, consistent with the current `ConflictError` convention. HTTP 412 is not used.

`/otec-compliance/profile` is a tenant-scoped singleton. Get, update, and deactivation do not accept `profileId`; application resolves the unique active non-deleted profile using the organization from authenticated `UseCaseContext`. Historical soft-deleted profiles are not current, and no ordering heuristic is used.

## Use Case to Exposure Matrix

| Use cases | Decision | Verb and path | Permission | Feature | Concurrency |
|---|---|---|---|---|---|
| Create/Get/Update OtecProfile | EXPOSED | `POST/GET/PATCH /otec-compliance/profile` | manage for create/update; read for get | `profile` | PATCH If-Match |
| DeactivateOtecProfile | EXPOSED | `POST /otec-compliance/profile/deactivation` | profile.manage | `profile` | If-Match |
| Create/List OtecAccreditation | EXPOSED | `POST/GET /otec-compliance/accreditations` | manage/read | `accreditations` | create none |
| Get/Update OtecAccreditation | EXPOSED | `GET/PATCH /otec-compliance/accreditations/{id}` | read/manage | `accreditations` | PATCH If-Match |
| Suspend/Revoke OtecAccreditation | EXPOSED | `POST .../{id}/suspension`, `POST .../{id}/revocation` | accreditation.manage | `accreditations` | If-Match |
| Create/List QualityCertification | EXPOSED | `POST/GET /otec-compliance/quality-certifications` | manage/read | `certifications` | create none |
| Get/Update QualityCertification | EXPOSED | `GET/PATCH /otec-compliance/quality-certifications/{id}` | read/manage | `certifications` | PATCH If-Match |
| DeactivateQualityCertification | EXPOSED | `POST .../{id}/deactivation` | certification.manage | `certifications` | If-Match |
| Create/List OtecOffice | EXPOSED | `POST/GET /otec-compliance/offices` | manage/read | `offices` | create none |
| Get/Update OtecOffice | EXPOSED | `GET/PATCH /otec-compliance/offices/{id}` | read/manage | `offices` | PATCH If-Match |
| DeactivateOtecOffice | EXPOSED | `POST .../{id}/deactivation` | office.manage | `offices` | If-Match |
| Create/List LegalRepresentative | EXPOSED | `POST/GET /otec-compliance/legal-representatives` | manage/read | `representatives` | create none |
| Get/Update LegalRepresentative | EXPOSED | `GET/PATCH /otec-compliance/legal-representatives/{id}` | read/manage | `representatives` | PATCH If-Match |
| DeactivateLegalRepresentative | EXPOSED | `POST .../{id}/deactivation` | representative.manage | `representatives` | If-Match |
| Create/List OtecResolution | EXPOSED | `POST/GET /otec-compliance/resolutions` | manage/read | `resolutions` | create none |
| Get/Update OtecResolution | EXPOSED | `GET/PATCH /otec-compliance/resolutions/{id}` | read/manage | `resolutions` | PATCH If-Match |
| SupersedeOtecResolution | EXPOSED | `POST /otec-compliance/resolutions/{replacedId}/supersession` | resolution.manage | `resolutions` | replaced If-Match; replacement tag in strict body |
| DeactivateOtecResolution | EXPOSED | `POST .../{id}/deactivation` | resolution.manage | `resolutions` | If-Match |
| EvaluateOtecReadiness | EXPOSED | `POST /otec-compliance/readiness/evaluations` | readiness.evaluate | `readiness` | none |
| GetOtecComplianceSummary | EXPOSED | `GET /otec-compliance/compliance-summary` | read | `readiness` | none |
| GetExpiringComplianceItems | EXPOSED | `GET /otec-compliance/expiring-items` | read | `expirations` | none |
| ValidateOtecCanPrepareSenceActivity | INTERNAL_ONLY | public readiness result already carries the preparation decision; future SENCE application composition may call it directly | readiness.evaluate | `readiness` | none |
| ActivateOtecProfile candidate | NOT_APPLICABLE | no path | none | none | none |
| Standalone findings/blocking queries | SUPERSEDED_BY | readiness and summary projections | read | `readiness` | none |

All 35 existing application use cases have a decision. The internal activity-validation query avoids a redundant public action endpoint and does not represent official SENCE validation.

## DTO and Filter Rules

Create DTOs accept only mutable business fields documented by their application contracts. PATCH DTOs omit tenant, actor, profile reassignment, lifecycle status, supersession links, version, audit, and derived fields. Lifecycle changes use explicit transition subresources. Responses remove `organizationId`, `deletedAt`, and infrastructure metadata, serialize dates, and retain resource `id`, stable enums/codes, version, and approved history links.

Filters are restricted to application-supported profile ID, type, status, effective date, expiration range/window, and expiration states. No speculative search or severity filter is introduced. Readiness responses contain `profileId`, `status`, `evaluatedAt`, `blockingFindings`, `warnings`, `passedRules`, and `policyVersion`.

## Error Matrix

| Condition | HTTP | Stable code | Disclosure |
|---|---:|---|---|
| Strict DTO/query/header format | 400 | `VALIDATION_ERROR` | Field issues only |
| Application semantic validation | 400 | `BAD_REQUEST` | Sanitized message |
| Unauthenticated | 401 | `UNAUTHORIZED` | No resource data |
| Permission denied | 403 | `FORBIDDEN` | No resource data |
| Entitlement/feature unavailable | 403 | `MODULE_UNAVAILABLE` | Module state only |
| Missing or cross-tenant resource | 404 | `NOT_FOUND` | Identical `Resource not found` |
| Business or stale-version conflict | 409 | `CONFLICT` | Sanitized conflict message |
| Unexpected error | 500 | `INTERNAL_SERVER_ERROR` | No stack, Prisma detail, or internal message |

422 is documented as reserved and unused because the existing project maps semantic `BadRequestError` to 400. Changing that convention requires a separate API-wide decision.

The normative classification is:

| Error source | HTTP | Reason |
|---|---:|---|
| Malformed JSON | 400 | The request cannot be parsed |
| Missing field or invalid format | 400 | The strict transport contract is invalid |
| Non-stateful semantic validation | 400 | The application rejected invalid input |
| Invalid lifecycle transition | 409 | The requested mutation conflicts with current state |
| Uniqueness or business invariant conflict | 409 | The requested state cannot coexist with persisted state |
| Stale optimistic version | 409 | `expectedVersion` did not match the persisted version |

The implementation and OpenAPI therefore advertise neither 412 nor 422. Cross-tenant lookups deliberately use the same 404 envelope as missing resources.

## Create Retry and Idempotency Decision

There is no persisted idempotency key, response replay, or idempotency middleware in the approved scope. Current create operations are synchronous and persistence plus audit execute in one transaction; an audit failure rolls back the create. A client timeout can still make the outcome unknown, and retrying can create a second audit attempt or a duplicate where no database uniqueness invariant exists.

| Create endpoint | Existing deterministic protection | Retry ambiguity | Decision |
|---|---|---|---|
| `POST /profile` | Tenant-scoped active singleton/partial uniqueness | A completed request followed by a retry returns conflict | `NOT_REQUIRED` for the current internal consumer |
| `POST /accreditations` | Tenant/profile business key and partial uniqueness | A completed request followed by the same retry returns conflict | `NOT_REQUIRED` for the current internal consumer |
| `POST /quality-certifications` | Tenant/profile certification key and partial uniqueness | A completed request followed by the same retry returns conflict | `NOT_REQUIRED` for the current internal consumer |
| `POST /offices` | Tenant/profile office code and partial uniqueness | A completed request followed by the same retry returns conflict | `NOT_REQUIRED` for the current internal consumer |
| `POST /legal-representatives` | No retry key or equivalent unique request identity | A timeout retry can create a second representative and audit record | `REQUIRED_BEFORE_EXTERNAL_CONSUMERS` |
| `POST /resolutions` | Tenant/profile resolution key and partial uniqueness | A completed request followed by the same retry returns conflict | `NOT_REQUIRED` for the current internal consumer |

`NOT_REQUIRED` is a bounded decision for the current authenticated internal workflow, not an exactly-once guarantee. Before exposing any create operation to external or automated consumers, the API design must reassess persisted idempotency and explicitly authorize any required infrastructure. No `Idempotency-Key` header is accepted or documented today.

## Rate Limiting and Internal-Only Validation

The existing application-wide IP rate limiter protects the mounted OTEC routes. It is process-local and is not an OTEC-specific distributed quota, so distributed enforcement remains Phase 2 debt before horizontally scaled or external consumption. No new rate-limit middleware is introduced here.

`ValidateOtecCanPrepareSenceActivity` remains application-internal because readiness already exposes the relevant preparation decision and a second public action would duplicate the contract. It has no productive route or OpenAPI operation. A future SENCE application-composition requirement may justify a separate, versioned exposure decision; it must not be interpreted as official SENCE validation.

## OpenAPI and Productive Delivery

The productive OpenAPI contract is `OTEC_HTTP_CONTRACTS.openapi.yml`. Resource-specific controllers and approved routes are composed under `/api/v1/otec-compliance`; authentication, permission and entitlement defense-in-depth, strict operation-specific schemas, safe errors, pagination, and weak ETag concurrency are active. Examples are fictitious and validated against the runtime request schemas. Readiness is an internal assessment and does not represent accreditation, authorization, or official SENCE approval. Durable idempotency and distributed rate limiting remain explicitly deferred.
