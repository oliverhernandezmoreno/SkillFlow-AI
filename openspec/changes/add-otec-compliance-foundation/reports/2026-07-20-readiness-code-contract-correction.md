# Readiness Finding Public Code Contract Correction

## Root Cause and Scope

`OtecReadinessEvaluator` correctly produced the internal domain property `ruleCode`. The application result reached `OtecComplianceQueryController.evaluate`, which used the generic `presentOtecResource` serializer. That serializer removed sensitive fields and serialized dates but performed no HTTP DTO mapping, so `ruleCode` leaked unchanged. Existing OpenAPI tests inspected the declared document and route structure; the PostgreSQL HTTP E2E asserted only readiness status and therefore did not compare real findings with `ReadinessFinding`.

The minimal correction is confined to the HTTP presentation boundary. `presentOtecReadiness` recursively maps `ruleCode` to `code`; the controller uses it only for evaluation responses. Domain and application contracts remain unchanged. No alias is emitted.

## RED Evidence

| Execution | Exit | Result |
|---|---:|---|
| `npx vitest run --config vitest.config.ts src/modules/otec-compliance/interfaces/http/contracts/otec-http-contracts.test.ts src/modules/otec-compliance/interfaces/http/routes/otec-compliance.http.e2e.test.ts` | 1 | 9 passed, 2 failed: mapper absent and runtime `code` undefined |
| `npx vitest run test/otec-completion-contracts.test.ts` | 1 | 4 passed, 1 failed: `ruleCode`-only payload was accepted |

## GREEN Evidence

| Execution | Exit | Result |
|---|---:|---|
| Targeted mapper, OpenAPI, PostgreSQL endpoint | 0 | 3 files, 22/22 passed |
| Backend regression | 0 | 46 files, 417/417 passed |
| Backend general PostgreSQL E2E | 0 | 3 files, 16/16 passed |
| Frontend unit/component/integration | 0 | 15 files, 49/49 passed |
| Playwright completion desktop/mobile | 0 | 6/6 passed |

Additional gates: backend build, frontend build (29 routes), backend/frontend ESLint, frontend TypeScript, Prisma validate, two OpenAPI YAML documents, 11/11 OpenAPI/router drift assertions, OpenSpec strict validation, and `git diff --check` all exited 0. No test was skipped.

PostgreSQL cleanup restored the certified baseline: RC1 profiles 0, resolutions 0, entitlements 0, fixture audits 0, authentication audits 12, and the demo tenant type `CLIENT_COMPANY`.

## Final Public DTO

```json
{
  "code": "OTEC-ACC-001",
  "severity": "BLOCKING",
  "message": "Configured accreditation evidence is missing"
}
```

`code` is present and non-empty. `ruleCode` is absent. The frontend Zod schema requires `code` and explicitly rejects `ruleCode`, including when supplied as an extra property.

## Files

- HTTP mapper: `src/modules/otec-compliance/interfaces/http/contracts/otec-http-presenter.ts`
- Controller: `src/modules/otec-compliance/interfaces/http/controllers/otec-compliance-query.controller.ts`
- Mapper/OpenAPI/E2E tests under `src/modules/otec-compliance/interfaces/http`
- Frontend schema and contract test under `frontend/features/otec-compliance/completion` and `frontend/test`
- OpenSpec API delta, tasks, Readiness documentation, matrix, and Enterprise RC1 report

No domain, application use case, repository, Prisma schema, migration, route, entitlement, permission, or unrelated functionality was changed. No commit, push, tag, release, or deployment was performed.
