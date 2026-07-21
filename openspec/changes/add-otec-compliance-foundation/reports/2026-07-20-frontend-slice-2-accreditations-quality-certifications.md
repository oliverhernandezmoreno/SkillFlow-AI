# Frontend Slice 2 — Accreditations and Quality Certifications

## Scope and result

The authorized Accreditation and Quality Certification vertical slices are implemented. No backend, migration, office, representative, resolution, readiness, external integration, or delivery operation was added.

## TDD evidence

- RED: `npm test -- --run test/otec-regulatory-contracts.test.ts` failed because the new schemas/services did not exist (exit 1).
- GREEN: the focused contract and component suites passed 2 files and 9 tests.
- REFACTOR: shared regulatory services, hooks, form shell, workspace navigation, retry policy, status presentation, and confirmation behavior were retained without creating a cross-domain generic resource framework.
- Browser correction: the first desktop run exposed a non-cached empty Zustand selector and an ambiguous Playwright alert locator. Both frontend defects were corrected; no backend change was required.

## Quality evidence

| Command | Exit | Files/tests | Passed | Failed | Skipped | Duration |
|---|---:|---:|---:|---:|---:|---:|
| `npm test` (frontend) | 0 | 12 files / 35 tests | 35 | 0 | 0 | 7.27 s |
| `npx tsc --noEmit` | 0 | TypeScript project | PASS | 0 | 0 | included in gate |
| `npm run lint` (frontend) | 0 | frontend | PASS | 0 | 0 | included in gate |
| `npm run build` (authorized environment) | 0 | 25 routes | PASS | 0 | 0 | 16.90 s |
| `npm run test:e2e -- --project=chromium-desktop e2e/otec-regulatory.spec.ts` | 0 | 1 file / 3 tests | 3 | 0 | 0 | 14.4 s |
| `npm run test:e2e -- --project=chromium-mobile e2e/otec-regulatory.spec.ts` | 0 | 1 file / 3 tests | 3 | 0 | 0 | 18.2 s |
| `npm test` (backend, authorized environment) | 0 | 46 files / 415 tests | 415 | 0 | 0 | 7.50 s wall |
| `npm run build` (backend) | 0 | backend | PASS | 0 | 0 | 7.02 s |
| `npm run lint` (backend) | 0 | backend | PASS | 0 | 0 | 15.33 s |
| `npm run prisma:validate` | 0 | schema | PASS | 0 | 0 | 1.43 s |
| OpenAPI YAML parse | 0 | 2 documents | 2 | 0 | 0 | 0.79 s |
| OpenAPI/router contract test | 0 | 1 file / 10 tests | 10 | 0 | 0 | 1.09 s wall |
| `openspec validate add-otec-compliance-foundation --strict` | 0 | 1 change | PASS | 0 | 0 | 0.41 s |
| `git diff --check` | 0 | workspace | PASS | 0 | 0 | 0.01 s |

The initial sandbox backend regression and frontend build failed with local PostgreSQL/listener restrictions (`listen EPERM` / Turbopack bind). Their authorized repetitions passed and are the product evidence.

## PostgreSQL restoration

After desktop and mobile runs, cleanup removed one accreditation, one certification, one active profile, their seven OTEC audit events, the temporary entitlement, and six browser-login audit events above the recorded baseline. Final counts for accreditations, certifications, profiles, OTEC entitlement, and OTEC audit events were all zero; the demo tenant was restored to `CLIENT_COMPANY`.

## Risks and debt

- Feature-level navigation visibility is derived from read permission; the backend entitlement response remains the authoritative feature gate because the current session contract does not expose enabled feature keys.
- The approved create contracts require `otecProfileId`; the frontend resolves it internally from the singleton. A future singleton child-create contract could remove that coupling.
- Derived expiry labels remain intentionally limited; no regulatory rule engine was duplicated in the browser.

## Decision

GO to request Frontend Slice 3. Do not start it automatically.
