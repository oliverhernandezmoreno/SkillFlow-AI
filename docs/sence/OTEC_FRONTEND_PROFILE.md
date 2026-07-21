# OTEC Compliance Frontend — Profile Slice

## Scope

Frontend Slice 1 delivers only the tenant-scoped OtecProfile singleton at `/otec-compliance/profile`. Accreditation, certification, office, legal-representative, resolution, readiness, summary, expiration, and activity-validation interfaces remain excluded.

The screen represents internal configuration only. It does not validate or communicate with SENCE, RUDO, OTIC, or LCE.

## Frontend Inventory

| Area | Current implementation | Reused | Slice change |
|---|---|---:|---|
| Routing | Next.js App Router | Yes | Added `/otec-compliance/profile` |
| Layout | Authenticated `AppShell`, responsive sidebar/topbar | Yes | Added permission-filtered navigation item |
| Authentication | Zustand session plus refresh-capable API client | Yes | Projected JWT permission claims into UI session state |
| API client | Shared typed `fetch` client | Yes | Added response metadata access for ETag |
| Server state | TanStack Query | Yes | Added singleton key and four Profile hooks |
| Forms | React Hook Form | Yes | Added create/edit Profile form |
| Validation | Zod | Yes | Added strict request/response schemas |
| Errors | `ApiClientError`, shared error/empty/loading states and toast | Yes | Added OTEC-specific status/code behavior |
| Confirmation | Radix dialog primitives | Yes | Added destructive Profile confirmation |
| Permissions | JWT permission claims; backend remains authoritative | Yes | Read/manage UI projection |
| Entitlement | Backend 403 `MODULE_UNAVAILABLE` | Yes | Explicit module-unavailable page state |
| Browser tests | None before this slice | No | Added Playwright desktop/mobile configuration |

## Architecture

- Page: `app/otec-compliance/profile/page.tsx`
- Feature: `features/otec-compliance/profile/`
- Query key: `['otec-compliance', 'profile']`
- Shared client extension: `apiRequestWithMetadata`
- GET/create/update responses bind `profile` and `etag` in the same query value.
- PATCH and deactivation send the captured ETag unchanged as `If-Match`.
- A stale 409 is never retried. The query is refetched and the dirty form remains mounted without resetting the safe draft.
- Successful deactivation clears cached singleton data before the 404 refetch.

No frontend API accepts `profileId`, `organizationId`, `tenantId`, or `actorId`. The route and query key contain no tenant identity.

## Endpoint-to-Screen Matrix

| Endpoint | Screen action | Version behavior |
|---|---|---|
| `GET /api/v1/otec-compliance/profile` | Load or empty state | Capture `ETag` |
| `POST /api/v1/otec-compliance/profile` | Create Profile | Capture returned `ETag` |
| `PATCH /api/v1/otec-compliance/profile` | Edit Profile | Send `If-Match`; capture new `ETag` |
| `POST /api/v1/otec-compliance/profile/deactivation` | Confirm deactivation | Send `If-Match`; clear singleton cache |

## Permission-to-UI Matrix

| Effective UI capability | Navigation | View | Create/Edit/Deactivate |
|---|---:|---:|---:|
| No OTEC permission | Hidden | Forbidden state on direct route | Hidden |
| `otec_compliance.read` | Visible | Allowed | Hidden |
| `otec_compliance.profile.manage` | Visible | Allowed | Allowed |
| Backend module unavailable | Entry may be visible until authoritative request | Module-unavailable state | Hidden by state |

The backend continues to enforce authentication, entitlement, feature, permission, tenant isolation, and domain rules.

## Error-to-UI Matrix

| HTTP/code | UI behavior |
|---|---|
| 400 | Form/request validation feedback |
| 401 | Session-expired state; shared refresh/logout remains active |
| 403 `FORBIDDEN` | Permission-denied state, no management actions |
| 403 `MODULE_UNAVAILABLE` | Dedicated entitlement-unavailable state |
| 404 | Empty Profile state; create CTA only with manage permission |
| 409 `CONFLICT` | Preserve draft, refetch current ETag/data, require user review |
| 412 | Defensive stale handling identical to 409; backend does not emit it |
| 422 | Defensive validation feedback; backend does not emit it |
| 500 | Sanitized unexpected-error state |
| Network error | Backend-unavailable state with retry action |

## Accessibility and Responsive Behavior

Fields have associated labels and described validation messages through the shared `FormField`. Feedback uses `role="alert"` or the toast live region. Radix manages dialog semantics and focus. Actions contain text, disabled progress states prevent double submission, and status is communicated with text rather than color alone. Tailwind breakpoints stack forms/actions on mobile and expand them on desktop. Playwright runs the same vertical workflow in Desktop Chrome and Pixel 5 viewports without sleeps or retries.

## Risks and Debt

- Entitlement is not included in the current session DTO. Navigation is permission-filtered and authoritative entitlement is discovered through the protected Profile request.
- JWT permission decoding is an untrusted UX projection only; it is not authorization.
- Browser coverage uses the real backend/PostgreSQL for the vertical mutation flow and request interception only for the explicit module-unavailable presentation scenario.
- A general reusable frontend entitlement registry can be designed when a supported entitlement read contract exists.
