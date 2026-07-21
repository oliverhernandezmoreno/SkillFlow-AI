# OTEC Application Security Hardening Checkpoint

**Canonical tasks:** 7.11.1–7.11.4 and backend-only 8.5–8.6  
**Decision:** GO to request separate HTTP authorization; HTTP remains unstarted

## Outcome

OtecProfile create/update/deactivate now authorize through the application policy and execute repository persistence plus audit in one `OtecComplianceTransactionManager` unit of work. PostgreSQL proves an audit foreign-key failure restores profile data and version and creates no audit.

All 35 existing application operations now enforce authenticated tenant/actor context, their entitlement feature, and a stable permission before resource access. The requested 36th item, ActivateOtecProfile, is `NOT_APPLICABLE` because it is absent from canonical OpenSpec and adding it would expand the domain. The complete initial and final mapping is in the initial matrix and `docs/sence/OTEC_COMPLIANCE_RBAC.md`.

Eight permissions reuse the existing Permission/RolePermission schema. The idempotent seed assigns them only to the existing `demo-admin` role and preserves unrelated permissions. Permission does not grant entitlement.

## TDD Evidence

- RED: missing application authorization policy module; 90 existing tests then exposed contexts without permissions.
- GREEN: context permission propagation, application policy, feature/permission checks, Profile unit of work, and permission seed.
- REFACTOR: entitlement-before-permission helpers shared by aggregate slices; read/manage permissions remain explicit at each operation.
- Focused application: 63/63 passed in 5 files, 971 ms.
- Focused PostgreSQL: 9/9 passed in 2 files, 1.07 s.
- Full backend final: 39 files, 359/359 passed, 0 failed/skipped/retried, 6.89 s.

## Quality Gates

| Gate | Exit | Result |
|---|---:|---|
| `npm run build` | 0 | TypeScript passed |
| `npm run lint` initial | 1 | One unused import introduced by refactor; corrected |
| `npm run lint` final | 0 | Passed |
| `npm test -- <five focused application files>` | 0 | 63/63 passed |
| `npm test -- <transaction and seed PostgreSQL files>` | 0 | 9/9 passed |
| `npm test` final | 0 | 39 files, 359/359 passed in 6.89 s |
| `npx prisma validate` | 0 | Schema valid |
| `npx openspec validate add-otec-compliance-foundation --strict` | 0 | Change valid |
| `git diff --check` | 0 | Passed |
| PostgreSQL restoration counts | 0 | Seven OTEC tables, OTEC permissions, and OTEC role assignments all zero |

No force exit, disabled test, hidden failure, retry, migration, controller, route, HTTP DTO, endpoint OpenAPI, frontend, or external integration was introduced.

## Files

Created:

- `src/modules/otec-compliance/application/services/otec-compliance-authorization.policy.ts`
- `src/modules/otec-compliance/application/services/otec-compliance-authorization.policy.test.ts`
- `src/modules/otec-compliance/infrastructure/prisma/seed-otec-compliance-permissions.ts`
- `src/modules/otec-compliance/infrastructure/prisma/seed-otec-compliance-permissions.integration.test.ts`
- `docs/sence/OTEC_COMPLIANCE_RBAC.md`
- initial hardening matrix and this report

Modified:

- `UseCaseContext` and authenticated request-context mapping
- all OTEC application use-case slices and their authorization helpers/tests
- three OtecProfile commands and Profile query
- Prisma transaction integration tests
- demo bootstrap permission composition/test expectation
- OpenSpec API specification and tasks
- application-use-case, architecture, and traceability documentation

## Remaining Debt and Risk

Canonical parent 7.11 remains open because its broader safe correlation/rule-code metadata and complete privacy audit are not part of the three authorized blockers; 7.12 also remains open. The seed currently assigns OTEC permissions only to `demo-admin`; production role mapping requires an explicit tenant/role policy during later delivery configuration. Existing `AppError.statusCode` predates this work and was not expanded.

No immediate contract-breaking backend debt remains for the separately authorized HTTP block. Defense-in-depth transport guards must not replace application enforcement.
