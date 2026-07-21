# Frontend Slice 3 — Offices and Legal Representatives

## Result

Office and Legal Representative vertical workflows are complete. No backend, migration, Resolution, Readiness, external integration, commit, push, tag, release, or deployment was performed.

## TDD

- RED: focused suite failed because administrative schemas/services did not exist (exit 1).
- GREEN: focused contracts/components passed 2 files and 9 tests.
- REFACTOR: extracted `useActiveOtecProfileContext` as the single authenticated Profile resolver and migrated Slice 2 to it.

## Gates

| Command | Exit | Result | Duration |
|---|---:|---|---:|
| `npm test` frontend | 0 | 14 files, 44/44, 0 skipped | 10.27 s wall |
| `npx tsc --noEmit` | 0 | PASS | 9.56 s |
| `npm run lint` frontend | 0 | PASS | 9.47 s |
| `npm run build` frontend | 0 | PASS, 27 routes | 23.08 s |
| Playwright desktop | 0 | 3/3, 0 skipped | 15.9 s |
| Playwright mobile | 0 | 3/3, 0 skipped | 16.3 s |
| `npm test` backend | 0 | 46 files, 415/415, 0 skipped | 10.96 s wall |
| `npm run build` backend | 0 | PASS | 9.71 s |
| `npm run lint` backend | 0 | PASS | 20.79 s |
| Prisma validate | 0 | PASS | recorded execution |
| OpenAPI parse/router drift | 0 | 2 YAML documents; 10/10 tests | recorded execution |

## Cleanup

Cleanup deleted one Office, one Representative, one Profile, one temporary entitlement, seven slice audit records, and six browser-login audits above baseline. Final Office, Representative, Profile, entitlement, and slice-audit counts are all zero; tenant type is restored to `CLIENT_COMPANY`.

## Risks and debt

- Feature-level entitlement keys are not session claims; backend responses remain authoritative for feature availability.
- Child create contracts still require `otecProfileId`; the shared resolver contains this compatibility debt.
- Full tax ID remains necessary in the authorized create/edit form but is omitted from lists and masked in detail.

## Decision

GO to request Frontend Slice 4. Do not start it automatically.
