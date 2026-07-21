# OTEC Readiness Contract-to-Runtime Matrix

| Concern | Domain/Application | HTTP runtime | OpenAPI | Frontend |
|---|---|---|---|---|
| Stable finding identifier | `ruleCode: string` | `code: string` | `ReadinessFinding.code`, required | `code: z.string().min(1)` |
| Internal-name disclosure | Allowed internally | `ruleCode` absent | `ruleCode` undeclared | Explicitly rejected |
| Mapping owner | None | `presentOtecReadiness` | Existing approved contract | No fallback |
| Runtime validation | Domain evaluator tests | PostgreSQL-backed productive endpoint | Schema loaded by E2E plus structural contract tests | Negative parser test |

The domain name remains unchanged because it expresses an internal regulatory rule concept. The HTTP boundary owns the public DTO transformation. The productive endpoint test loads `ReadinessFinding` from `OTEC_HTTP_CONTRACTS.openapi.yml`, validates required fields and declared string types against real runtime findings, and separately proves `ruleCode` is absent.
