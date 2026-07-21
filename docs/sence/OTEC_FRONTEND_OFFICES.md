# OTEC Offices Frontend

`/otec-compliance/offices` provides responsive list, detail, create, edit, and explicit deactivation workflows. It uses the existing authenticated API client, TanStack Query, React Hook Form, Zod, ETag/If-Match, status badges, dialogs, and OTEC navigation.

Query keys are `['otec-compliance', 'offices', filters]` and `['otec-compliance', 'offices', id]`. Visible filters are approved `status`, `type`, `validAt`, `page`, and `pageSize`.

| Action | Endpoint | Permission |
|---|---|---|
| List/detail | `GET /offices`, `GET /offices/{id}` | `otec_compliance.read` |
| Create/update/deactivate | `POST /offices`, `PATCH /offices/{id}`, `POST /offices/{id}/deactivation` | `otec_compliance.office.manage` |

Create resolves the required profile identifier through `useActiveOtecProfileContext`; users cannot view, edit, route, or persist that identifier. Updates and deactivation send the exact detail ETag through `If-Match`. HTTP 409 preserves the draft and refetches current detail without retrying.

Errors distinguish session, permission, module availability, missing/inactive Profile, transport validation, conflict, and unexpected failure. The UI manages internal evidence only and makes no official-system validation claim.
