# OTEC HTTP Contractual Hardening Checkpoint

## Authorized scope

This checkpoint covers only HTTP contract hardening: the stable error-status decision, operation-specific OpenAPI contracts, and the create idempotency decision. It introduces no routes, controllers, application/domain behavior, persistence, migrations, external integrations, or frontend work.

## Completed OpenSpec work

- 8.7, 8.7.1, and 8.7.2: create retry/idempotency and rate-limit assessment.
- 12.1.2: 400/409 policy resolution with 412/422 explicitly excluded.
- 12.1.3: contract tests added RED-first.
- 12.1.4: operation-specific OpenAPI components and fictitious validated examples.
- 12.1 and 12.1.5 remain open until the complete regression and PostgreSQL E2E gates can run.

## Contract decisions

- Malformed JSON, strict DTO/header/query failures, and non-stateful semantic validation use HTTP 400.
- Lifecycle, uniqueness, business-state, and stale optimistic-version conflicts use HTTP 409.
- HTTP 412 and 422 are not advertised or emitted by this contract.
- Missing and cross-tenant resources retain the same non-disclosing 404 envelope.
- Legal representative create is `REQUIRED_BEFORE_EXTERNAL_CONSUMERS`; the other five creates are `NOT_REQUIRED` only for the current internal workflow because existing singleton/partial-unique constraints provide deterministic conflict behavior.
- No endpoint accepts `Idempotency-Key` or claims persisted replay/exactly-once behavior.
- Readiness remains an internal assessment, not accreditation, authorization, or official SENCE approval.
- Activity preparation validation remains internal-only with no route or OpenAPI operation.

## TDD evidence

The initial OpenAPI contract run produced three expected failures: generic request bodies, the missing stable error-policy statement, and generic success responses. After the implementation, the focused contract suite passes 10/10 tests. The final suite also resolves every local `$ref`, detects unused schema components, checks strict response schemas, excludes tenant/actor/soft-delete fields, and validates request examples against runtime Zod schemas.

## Quality gates

| Gate | Result |
|---|---|
| Focused OpenAPI contract | PASS — 10/10 |
| HTTP contract/controller/router/middleware suite | PASS — 44/44 across 6 files |
| TypeScript build | PASS |
| ESLint | PASS |
| Prisma validate | PASS |
| OpenSpec strict validation | PASS |
| Full backend regression | BLOCKED — execution approval rejected by environment usage limit before tests started |
| PostgreSQL HTTP E2E | BLOCKED — same execution constraint; not attempted indirectly |
| PostgreSQL cleanup | NOT REQUIRED for completed focused suites; they did not access PostgreSQL |

The first sandboxed Supertest attempt failed only with `listen EPERM`; rerunning the focused HTTP suite with approved local-listener access passed 44/44. This was an environment restriction, not a product failure.

## Modified files in this slice

- `docs/sence/OTEC_HTTP_CONTRACTS.md`
- `docs/sence/OTEC_HTTP_CONTRACTS.openapi.yml`
- `openspec/changes/add-otec-compliance-foundation/specs/otec-compliance-api/spec.md`
- `openspec/changes/add-otec-compliance-foundation/tasks.md`
- `openspec/changes/add-otec-compliance-foundation/reports/2026-07-17-otec-http-endpoint-inventory.md`
- `openspec/changes/add-otec-compliance-foundation/reports/2026-07-17-otec-http-contractual-hardening.md`
- `src/modules/otec-compliance/interfaces/http/contracts/otec-openapi-contract.test.ts`
- `src/types/js-yaml.d.ts`

## Risks and debt

- Persisted idempotency is absent. Legal representative create must not be exposed to external/automated retrying consumers before a separately authorized solution exists.
- Existing rate limiting is process-local and requires a distributed design before horizontally scaled/external use.
- The full regression and PostgreSQL HTTP E2E evidence remain missing because the execution environment rejected the necessary authorization.

## Decision

**NO-GO for frontend.** The contractual implementation itself is green on focused tests, build, lint, Prisma, and strict OpenSpec validation, but the authorized completion criteria require full backend regression and related PostgreSQL E2E evidence. No frontend work may begin until those two gates pass and 12.1/12.1.5 are closed.
