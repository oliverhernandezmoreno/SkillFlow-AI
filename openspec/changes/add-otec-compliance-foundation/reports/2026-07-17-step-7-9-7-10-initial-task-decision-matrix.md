# Steps 7.9–7.10 Initial Task Decision Matrix

| Task/capability | Canonical description | Current state | Evidence | Type | Proposed action | Justification |
| --- | --- | --- | --- | --- | --- | --- |
| 7.9 readiness tests | Readiness query behavior | Complete | `evaluate-otec-readiness.use-case.test.ts`; integral evaluator suite; PostgreSQL snapshot suite | Query/tests | COMPLETED | Tenant, entitlement, clock, effective policy, outcomes, soft delete, and supersession are proven |
| 7.10 readiness implementation | Evaluate internal readiness | Complete | `EvaluateOtecReadinessUseCase`; `OtecReadinessEvaluator`; snapshot port/adapter | Query | COMPLETED | Stable application output already exists without Prisma or HTTP coupling |
| 7.9 summary tests | Compliance summary behavior | Pending | No summary use case or dedicated test exists | Query/tests | Implement | Explicitly required by canonical 7.9 and readiness capability |
| 7.10 summary implementation | Compliance summary projection | Pending | Readiness result contains all required source data | Query | Implement as projection | Distinct compact consumer contract; must not duplicate rules |
| 7.9 expiration tests | Paginated exceptional expiration listing | Partial | Evaluator tests cover expiring warnings; repository filters cover some date ranges | Query/tests | Implement remaining behavior | OpenSpec explicitly requires expired, undated, suspended, revoked, upcoming, pagination, and deterministic order |
| 7.10 expiration implementation | Configurable expiration query | Pending | Snapshot port exposes tenant/profile records and effective policy | Query | Implement | Can be derived without migration or additional repository and without N+1 |
| 7.9 activity-preparation tests | Internal preparation gate | Pending | Readiness outcomes exist; no gate contract | Query/tests | Implement | Explicit OpenSpec requirement with distinct allow/deny contract |
| 7.10 activity-preparation implementation | Validate internal preparation | Pending | `EvaluateOtecReadinessUseCase` provides authoritative evidence | Query | Implement as projection | Avoids rule duplication and external integration |
| Findings query | Separate findings lookup | Covered by consolidated result | `OtecReadinessResult.findings` | Query | SUPERSEDED_BY `EvaluateOtecReadinessUseCase` | Separate use case adds no capability |
| Blocking-items query | Separate blocker lookup | Covered by consolidated result | `OtecReadinessResult.blockingIssues` | Query | SUPERSEDED_BY `EvaluateOtecReadinessUseCase` | Separate use case adds no capability |
| Readiness history persistence | Persist/evaluate readiness history | Not required by 7.9–7.10 | Explicit `evaluationDate`; no approved history table | Query/persistence | EXCLUDED_BY_DESIGN | Historical recomputation is supported; persistence would require unauthorized schema and audit decisions |
| Current resolution/history queries | Resolution-specific read inventory | Already covered outside this block | Get/List resolution use cases; `ResolutionChainResolver` | Query | NOT_APPLICABLE to 7.9–7.10 | Canonical tasks require compliance-level queries, not speculative resolution endpoints |
| RBAC enforcement | Permission check in delivery order | Pending canonical task 8.5–8.6 | Architecture and permission identifiers exist; current application use cases enforce tenant/entitlement | Delivery authorization | DEFERRED_TO_HTTP 8.5–8.6 | Project architecture applies permission after feature entitlement at the delivery boundary; no new guard is authorized here |
| Query audit | Persist audit for reads | No write | Existing mutation-only behavior; user authorization forbids unnecessary query writes | Query | EXCLUDED_BY_DESIGN for this checkpoint | Queries remain side-effect free; broader sensitive-read audit policy belongs to 7.11 if approved |

No Command is introduced by this closure. All remaining 7.9–7.10 application capabilities are Queries.
