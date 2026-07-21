# Frontend Slice 1 — OTEC Profile

**Date:** 2026-07-20  
**Change:** `add-otec-compliance-foundation`  
**Route:** `/otec-compliance/profile`  
**Decision:** GO to request Frontend Slice 2; do not start it automatically.

## Scope and TDD

Only OtecProfile was delivered. RED began with two missing-suite failures for contracts/services/page behavior. GREEN added the shared-client ETag extension, strict schemas, Profile service/hooks, page, create/edit form, deactivation dialog, permission-filtered navigation, error states, and Playwright. REFACTOR fixed stable Zustand snapshots, stale-draft preservation, deactivation cache clearing, runner separation, and existing Vitest global typing.

Browser integration revealed one real backend defect: CORS did not expose the already-contracted `ETag` header. The minimal backend correction added `exposedHeaders: ['ETag']` plus a Supertest regression test. No route, controller, domain, persistence, OpenAPI, or migration changed.

## Test and Quality Results

| Command | Exit | Files | Passed | Failed | Skipped | Duration/notes |
|---|---:|---:|---:|---:|---:|---|
| `npm test -- --run test/otec-profile-contracts.test.ts test/otec-profile-page.test.tsx` | 0 | 2 | 10 | 0 | 0 | 2.45 s |
| `npm test` (frontend final) | 0 | 10 | 26 | 0 | 0 | 6.66 s; 7.32 s wall |
| `npx tsc --noEmit` | 0 | N/A | PASS | 0 | 0 | 7.38 s |
| `npm run lint` (frontend) | 0 | N/A | PASS | 0 | 0 | 6.87 s |
| `npm run build` (authorized host) | 0 | 23 routes | PASS | 0 | 0 | 17.99 s wall |
| `npm run test:e2e -- --project=chromium-desktop` | 0 | 1 | 2 | 0 | 0 | 12.7 s |
| `npm run test:e2e -- --project=chromium-mobile` | 0 | 1 | 2 | 0 | 0 | 13.8 s |
| `npx vitest run --config vitest.config.ts src/app.cors.test.ts` | 0 | 1 | 1 | 0 | 0 | 46 ms test |
| `npm test` (backend final) | 0 | 46 | 415 | 0 | 0 | 8.85 s; 9.38 s wall |
| `npm run build` (backend) | 0 | N/A | PASS | 0 | 0 | Green |
| `npm run lint` (backend) | 0 | N/A | PASS | 0 | 0 | Green |
| `npx vitest run --config vitest.config.ts src/modules/otec-compliance/interfaces/http/contracts/otec-openapi-contract.test.ts` | 0 | 1 | 10 | 0 | 0 | 624 ms suite |
| `openspec validate add-otec-compliance-foundation --strict` | 0 | 1 change | PASS | 0 | 0 | Green |
| `git diff --check` | 0 | N/A | PASS | 0 | 0 | Green |

The first sandboxed frontend build failed because Turbopack attempted to bind a local port and received `EPERM`; the authorized rerun passed. Early Playwright RED executions exposed CORS origin setup, unstable Zustand snapshots, missing browser-visible ETag, and stale deactivation cache; each correction is covered by the final green runs. No retries or arbitrary sleeps were used.

## Browser Evidence

Desktop Chrome and Pixel 5 flows used the real Express backend, authentication, Profile routes, application layer, Prisma, and PostgreSQL for login, empty state, create, view, update, external concurrent update, stale 409, refetch with safe draft preservation, and confirmed deactivation. The module-unavailable presentation used request interception because the public API provides no frontend entitlement-management endpoint.

The fixture temporarily changed the demo organization from `CLIENT_COMPANY` to `OTEC`, added one Profile entitlement, and created Profile/audit rows through the API. Cleanup deleted 6 test Profile histories and 18 related audit rows, removed the entitlement, and restored `CLIENT_COMPANY`. Final Profile, entitlement, and Profile-audit fixture counts were all zero.

## Security and Contract Evidence

- Route: `/otec-compliance/profile`; no `profileId` or tenant identity.
- Query key: `['otec-compliance', 'profile']`.
- Forms and payloads contain no `organizationId`, `tenantId`, `actorId`, `profileId`, or body `version`.
- GET/create/update bind ETag to query data; PATCH/deactivation send it unchanged through `If-Match`.
- 409/defensive 412 do not retry; current data is refetched and dirty draft input is retained.
- JWT permission decoding is UI projection only. Backend authentication, tenant, entitlement, feature, RBAC, and domain enforcement remain authoritative.
- 403 `FORBIDDEN` and `MODULE_UNAVAILABLE`, 404 empty, 409 conflict, session, network, validation, and unexpected failures are differentiated.
- Labels, alert/live regions, Radix dialog semantics/focus, text status, disabled progress, desktop/mobile layouts, and destructive confirmation are present.

## Corrections

1. Added browser-readable CORS `ETag` exposure after real integration proved it missing.
2. Stabilized Zustand selectors to avoid a browser render loop.
3. Projected access-token permission claims into the frontend session for UX filtering.
4. Cleared singleton cache after deactivation.
5. Preserved dirty drafts during stale refetch.
6. Isolated Playwright files from Vitest and added Vitest globals to TypeScript.
7. Made the permission-seed integration cleanup preserve globally referenced OTEC permissions.

## Risks and Debt

- Entitlement is not part of the session DTO, so navigation is permission-filtered and authoritative entitlement is discovered on the first module request.
- The module-unavailable Playwright presentation is intercepted; the primary vertical workflow is real end to end.
- A reusable entitlement registry and broader reusable concurrency form abstraction are deferred until later slices justify them.
- Installed dependency audit reports 2 moderate and 4 high issues in the existing dependency graph; no broad dependency upgrade was attempted in this slice.

No accreditation, certification, office, representative, resolution, readiness, summary, expiration, audit UI, external integration, migration, commit, push, tag, release, or deployment was added.
