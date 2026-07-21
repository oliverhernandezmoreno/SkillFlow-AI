# OTEC Compliance Readiness Frontend

The authenticated `/otec-compliance/readiness` route is an executive, responsive view of backend-authoritative OTEC compliance data. It displays only the backend evaluation score and status, regulatory findings, blockers, recommendations, expiration evidence, and persisted resource totals.

The frontend does not reproduce or infer regulatory rules. It invokes the readiness evaluation, compliance summary, expiration query, and resource list contracts through the shared authenticated API client. A denied entitlement renders an error state and no dashboard values. The route states explicitly that results are internal configured-record evidence and not official validation.

The public finding contract requires a non-empty `code`. The frontend schema rejects the internal backend/domain name `ruleCode`; no compatibility alias or fallback remains.

The layout uses semantic headings, labeled navigation, status text in addition to color, responsive grids, and reusable loading/error components. Desktop and mobile browser tests cover the productive HTTP and PostgreSQL path.
