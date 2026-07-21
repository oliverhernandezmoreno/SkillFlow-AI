# OTEC Quality Certification Frontend

## Route and architecture

`/otec-compliance/quality-certifications` reuses the authenticated OTEC workspace, typed HTTP metadata handling, stable queries, form primitives, status badges, dialogs, responsive cards, and Playwright fixture strategy from the Profile and Accreditation slices. Certification fields remain semantically distinct.

Query keys are `['otec-compliance', 'quality-certifications', filters]` and `['otec-compliance', 'quality-certifications', id]`. Visible filters are `page`, `pageSize`, `status`, `type`, and `validAt`.

## Endpoint-to-screen matrix

| Screen action | Endpoint | Concurrency |
|---|---|---|
| List | `GET /otec-compliance/quality-certifications` | None |
| Detail | `GET /otec-compliance/quality-certifications/{id}` | Captures `ETag` |
| Create | `POST /otec-compliance/quality-certifications` | None |
| Edit | `PATCH /otec-compliance/quality-certifications/{id}` | Exact `If-Match` |
| Deactivate | `POST /otec-compliance/quality-certifications/{id}/deactivation` | Exact `If-Match` |

The form supports only `NCH_2728`, `ISO_9001`, and `OTHER`, plus the approved number, certifying entity, scope, dates, optional document reference, and notes. It rejects unknown fields and invalid date ranges.

## Permission and error behavior

| Action | Permission | UI behavior |
|---|---|---|
| Read | `otec_compliance.read` | Shows list/detail and approved filters |
| Create/update/deactivate | `otec_compliance.certification.manage` | Shows actions only; backend enforces security |

Error handling matches the Accreditation matrix: dedicated entitlement and forbidden states, safe validation/business errors, and stale HTTP 409 draft preservation with detail reload and no mutation retry.

Desktop and mobile use stacked cards and wrapping actions without horizontal tables. Labels, focus rings, live feedback, semantic headings, and Radix confirmation focus management provide the basic accessibility baseline. The UI makes no official integration or validation claim.
