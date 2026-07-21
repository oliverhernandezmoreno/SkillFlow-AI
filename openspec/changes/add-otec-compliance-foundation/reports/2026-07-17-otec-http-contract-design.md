# OTEC HTTP Contract Design Checkpoint

**Canonical tasks:** 8.1–8.2, partial 12.1.1 and 12.3.1  
**Delivery status:** design-only; controllers and routes not started

The exposure matrix classifies all 35 existing use cases plus the non-applicable activation candidate. Activity validation is internal-only, findings/blocking queries remain superseded, and all other approved resources use explicit REST resources or lifecycle transition subresources.

Transport contracts use strict Zod objects, ISO dates, existing page/pageSize pagination, stable application error codes, sanitized cross-tenant 404 output, and one concurrency convention: `If-Match: W/"vN"` with response `ETag`. No body accepts tenant, actor, protected relationship, derived status, or expectedVersion.

## TDD and Gates

- RED: missing schema, concurrency, presenter, and error-mapper modules.
- GREEN: six contract tests passed; OpenAPI added two design-status assertions.
- REFACTOR: shared strict date-range, query, concurrency, presentation, and safe-error primitives.
- Focused contract tests: 2 files, 8/8 passed in 458 ms.
- OpenAPI YAML syntax: `node_modules/.bin/js-yaml docs/sence/OTEC_HTTP_CONTRACTS.openapi.yml`, exit 0.
- Build passed after one TypeScript generic-date correction.
- Initial lint found two type-safety issues; both were corrected before final gates.

Created files are `OTEC_HTTP_CONTRACTS.md`, its design-only OpenAPI fragment, and five transport contract/test modules under `interfaces/http/contracts`. Modified artifacts are OpenSpec API/tasks plus affected SENCE architecture, application inventory, and traceability documents.

Route-drift, curl, productive controller integration, definitive route registration, idempotency infrastructure, and full main-OpenAPI implementation marking remain deferred to their canonical tasks. No migration, frontend, external integration, commit, push, tag, or deployment is part of this checkpoint.
