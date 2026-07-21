# OTEC Legal Representatives Frontend

`/otec-compliance/legal-representatives` implements responsive list, detail, create, edit, and explicit deactivation. Query keys are `['otec-compliance', 'legal-representatives', filters]` and `['otec-compliance', 'legal-representatives', id]`; approved visible filters are `status`, `validAt`, `page`, and `pageSize`.

| Action | Endpoint | Permission |
|---|---|---|
| List/detail | `GET /legal-representatives`, `GET /legal-representatives/{id}` | `otec_compliance.read` |
| Create/update/deactivate | resource `POST`, `PATCH`, and `/deactivation` | `otec_compliance.representative.manage` |

The shared authenticated Profile resolver supplies the required `otecProfileId`; it is never user-editable or sourced from URL/local storage. ETag/If-Match and stale HTTP 409 behavior match the certified slices.

Personal-data controls: fictitious fixtures only, no console logging or local persistence, no tax ID in list cards, masked tax ID in detail, full value limited to the authorized edit form, and no PII in UI errors or correlation identifiers. Backend authorization and non-disclosure remain authoritative.
