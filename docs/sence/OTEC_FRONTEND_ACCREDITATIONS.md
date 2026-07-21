# OTEC Accreditation Frontend

## Route and architecture

`/otec-compliance/accreditations` uses the authenticated layout, the shared OTEC secondary navigation, the existing HTTP client, TanStack Query, React Hook Form, and Zod. `RegulatoryPage` supplies the responsive list/detail workflow while `RegulatoryForm` renders accreditation-specific fields.

Query keys are `['otec-compliance', 'accreditations', filters]` and `['otec-compliance', 'accreditations', id]`. Lists support only `page`, `pageSize`, `status`, and `validAt` in the UI. The typed service also preserves the approved contract filters for future approved controls.

## Endpoint-to-screen matrix

| Screen action | Endpoint | Concurrency |
|---|---|---|
| List | `GET /otec-compliance/accreditations` | None |
| Detail | `GET /otec-compliance/accreditations/{id}` | Captures `ETag` |
| Create | `POST /otec-compliance/accreditations` | None |
| Edit | `PATCH /otec-compliance/accreditations/{id}` | Exact `If-Match` |
| Suspend | `POST /otec-compliance/accreditations/{id}/suspension` | Exact `If-Match` |
| Revoke | `POST /otec-compliance/accreditations/{id}/revocation` | Exact `If-Match` |

Creation obtains the contract-required active `otecProfileId` from the tenant singleton query. Forms and public service inputs never accept `organizationId`, `tenantId`, `actorId`, or `version`.

## Permission and error behavior

| Action | Permission | UI behavior |
|---|---|---|
| Read | `otec_compliance.read` | Shows route, list, filters, pagination, and detail |
| Create/update/transition | `otec_compliance.accreditation.manage` | Shows management controls; backend remains authoritative |

| Response | UI behavior |
|---|---|
| 400 | Field/request feedback without internal details |
| 401 | Session-expired state through the shared client |
| 403 `MODULE_UNAVAILABLE` | Dedicated entitlement-unavailable state, no controls |
| Other 403 | Forbidden state, no controls |
| 404 | Safe not-found behavior |
| 409 duplicate/transition | Business-safe error |
| 409 stale version | Preserves draft, refetches detail, never retries or overwrites |
| 500/network | Retryable query error; mutations are not retried |

The UI is internal evidence management and does not represent official SENCE, RUDO, OTIC, or LCE validation.
