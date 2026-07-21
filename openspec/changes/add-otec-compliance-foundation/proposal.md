## Why

SkillFlow AI can prepare local SENCE declaration evidence but cannot determine whether a tenant has the internally configured, current OTEC antecedents needed to begin preparing a SENCE-associated training activity. A dedicated OTEC Compliance foundation is needed to manage those antecedents without implying official validation by SENCE, RUDO, OTIC, or LCE.

## What Changes

- Add a tenant-scoped, independently entitled `OTEC_COMPLIANCE` module with enabled, disabled, suspended, expired, and plan-restricted access outcomes.
- Add internal OTEC profile, accreditation, quality certification, office, legal representative, and resolution records with soft deletion, audit history, effective dates, and real optimistic concurrency.
- Add configurable internal compliance rules, expiration windows, readiness evaluation, summary, expiration queries, and activity-preparation validation.
- Add protected REST endpoints and a backend authorization sequence covering tenant context, module entitlement, feature access, permission, and domain rules.
- Add a connected frontend area under Settings for OTEC profile data, antecedent management, readiness blockers and warnings, and upcoming expirations.
- Add incremental Prisma persistence and clearly fictitious demo seed data.
- Extend OpenAPI, RBAC documentation, SENCE domain documentation, and implementation traceability.
- Explicitly exclude official SENCE/RUDO/OTIC/LCE communication, official accreditation validation, pre-liquidation, liquidation, billing, electronic signatures, biometrics, and real e-learning control.

## Capabilities

### New Capabilities

- `otec-module-entitlement`: Tenant-level availability and access enforcement for the independently enabled OTEC Compliance module.
- `otec-regulatory-records`: Tenant-scoped management of OTEC profiles, accreditations, quality certifications, offices, legal representatives, and resolutions.
- `otec-readiness`: Configurable internal readiness and expiration evaluation that returns `READY`, `READY_WITH_WARNINGS`, or `NOT_READY` with rule-level evidence.
- `otec-compliance-api`: Versioned, authenticated, RBAC-protected HTTP contracts with validation, pagination, tenant isolation, audit behavior, and concurrency conflicts.
- `otec-compliance-workspace`: Connected frontend workflows for compliance summary, configuration records, critical states, and expirations.
- `otec-compliance-traceability`: Audit, OpenAPI, regulatory documentation, test evidence, and implementation reporting for the module.

### Modified Capabilities

No existing OpenSpec capabilities are modified. The repository currently has no main capability specifications.

## Impact

- New bounded context under `src/modules/otec-compliance` and corresponding frontend feature/workspace.
- Incremental Prisma models, enums, indexes, partial unique indexes, and migration.
- Minimal reusable module-entitlement contract and persistence; no billing engine.
- New permissions and demo-role assignments; existing public contracts remain compatible.
- Additive `/api/v1/otec-compliance/*` HTTP surface and OpenAPI schemas.
- Reuse of authenticated tenant context, organization read data, audit logging, pagination, error handling, and validation conventions.
- Optional document references are validated through a tenant-ownership port; no document platform or external regulatory integration is introduced.
