# SENCE and OTEC Regulatory Rule Catalog

## Governance

This catalog defines a versionable product structure for internal rules. It does not reproduce regulations and does not establish official compliance. `validationStatus` controls whether a rule has been reviewed by an authorized functional owner.

Required metadata for every rule:

```text
ruleCode, name, description, category, applicableModality,
effectiveFrom, effectiveTo, sourceReference, sourceVersion,
severity, inputData, expectedResult, failureMessage, exceptions,
configurationKey, testCases, validationStatus
```

Allowed validation statuses are `REQUIRES_FUNCTIONAL_VALIDATION`, `FUNCTIONALLY_VALIDATED`, `SUPERSEDED`, and `DISABLED`. Phase 1 defaults regulatory interpretations to `REQUIRES_FUNCTIONAL_VALIDATION`; technical integrity rules may be validated by engineering/product ownership.

## Phase 1 Rule Definitions

### OTEC-FOUND-001 — Organization is internally identified as OTEC

| Field | Value |
|---|---|
| category | `OTEC_FOUNDATION` |
| applicableModality | `ALL` |
| effectiveFrom/effectiveTo | Configuration effective period; no regulatory date hardcoded |
| sourceReference/sourceVersion | Internal product prerequisite / `1.0` |
| severity | `BLOCKING` |
| inputData | Organization ID, type, status |
| expectedResult | Organization belongs to evaluated tenant, is active, and type is `OTEC` |
| failureMessage | Organization is not internally configured as an active OTEC |
| exceptions | None in Phase 1 |
| configurationKey | `otec.requireOrganizationType` |
| testCases | OTEC active; non-OTEC; inactive; foreign organization |
| validationStatus | `FUNCTIONALLY_VALIDATED` as product behavior, not official status |

### OTEC-FOUND-002 — One active OTEC profile

| Field | Value |
|---|---|
| category | `OTEC_FOUNDATION` |
| applicableModality | `ALL` |
| severity | `BLOCKING` |
| inputData | Same-tenant non-deleted profiles |
| expectedResult | Exactly one active profile for readiness; at most one active profile for persistence |
| failureMessage | Active OTEC profile is missing or duplicated |
| exceptions | Historical soft-deleted profiles do not count |
| configurationKey | `otec.requireActiveProfile` |
| testCases | One; none; duplicate attempt; soft-deleted prior profile |
| validationStatus | `FUNCTIONALLY_VALIDATED` as product behavior |

### OTEC-ACC-001 — Current active accreditation record

| Field | Value |
|---|---|
| category | `OTEC_ACCREDITATION` |
| applicableModality | `ALL` |
| effectiveFrom/effectiveTo | Rule configuration dates |
| sourceReference/sourceVersion | Functional source must be attached before production / pending |
| severity | `BLOCKING` |
| inputData | Accreditation status, validFrom, validUntil, suspension/revocation dates |
| expectedResult | At least one same-tenant accreditation is active and effective at evaluation time |
| failureMessage | No current active internal accreditation record exists |
| exceptions | Undated-record treatment is configurable |
| configurationKey | `otec.accreditation.required` |
| testCases | Current; future; expired; suspended; revoked; missing; historical evaluation |
| validationStatus | `REQUIRES_FUNCTIONAL_VALIDATION` |

### OTEC-QUAL-001 — Current NCh2728 when configured

| Field | Value |
|---|---|
| category | `QUALITY_CERTIFICATION` |
| applicableModality | `ALL` |
| sourceReference/sourceVersion | Source reference recorded in configuration; current applicability requires functional review |
| severity | `BLOCKING` when required, `NOT_APPLICABLE` otherwise |
| inputData | Configuration and `NCH_2728` certification status/validity |
| expectedResult | Current active certification exists when the effective tenant configuration requires it |
| failureMessage | Required current NCh2728 record is missing or not effective |
| exceptions | Tenant/effective configuration can mark it not applicable |
| configurationKey | `otec.quality.nch2728.required` |
| testCases | Required/current; required/missing; required/expired; optional/missing; warning window |
| validationStatus | `REQUIRES_FUNCTIONAL_VALIDATION` |

### OTEC-OFF-001 — Active qualifying office

| Field | Value |
|---|---|
| category | `OTEC_OFFICE` |
| applicableModality | `ALL` |
| sourceReference/sourceVersion | Pending functional validation |
| severity | `BLOCKING` |
| inputData | Office type, status, validity, tenant, configured qualifying types |
| expectedResult | At least one current active office has a configured qualifying type |
| failureMessage | No current active qualifying OTEC office exists |
| exceptions | Qualifying office types are configuration, not hardcoded regulatory interpretation |
| configurationKey | `otec.office.qualifyingTypes` |
| testCases | Headquarters; branch; inactive; expired; unqualified training site; missing |
| validationStatus | `REQUIRES_FUNCTIONAL_VALIDATION` |

### OTEC-REP-001 — Current active legal representative

| Field | Value |
|---|---|
| category | `LEGAL_REPRESENTATION` |
| applicableModality | `ALL` |
| sourceReference/sourceVersion | Pending functional validation |
| severity | `BLOCKING` |
| inputData | Representative active flag and effective dates |
| expectedResult | At least one same-tenant representative is active and effective |
| failureMessage | No current active legal representative exists |
| exceptions | Undated-record treatment is configurable |
| configurationKey | `otec.representative.required` |
| testCases | Current; expired; future; inactive; missing; invalid RUT |
| validationStatus | `REQUIRES_FUNCTIONAL_VALIDATION` |

### OTEC-RES-001 — Configured required resolutions

| Field | Value |
|---|---|
| category | `ADMINISTRATIVE_RESOLUTION` |
| applicableModality | Configuration may narrow applicability |
| sourceReference/sourceVersion | Per-resolution rule configuration |
| severity | Configurable, default `BLOCKING` for listed required types |
| inputData | Required types, status, validity, supersession chain |
| expectedResult | A current non-superseded same-tenant resolution exists for every configured required type |
| failureMessage | Required resolution is missing, expired, inactive, or superseded |
| exceptions | Empty required-type list passes |
| configurationKey | `otec.resolution.requiredTypes` |
| testCases | All present; one missing; expired; superseded; empty configuration; cycle rejected |
| validationStatus | `REQUIRES_FUNCTIONAL_VALIDATION` |

### OTEC-DOC-001 — Document tenant ownership

| Field | Value |
|---|---|
| category | `DOCUMENT_INTEGRITY` |
| applicableModality | `ALL` |
| sourceReference/sourceVersion | Internal security requirement / `1.0` |
| severity | `BLOCKING` for writes containing document IDs |
| inputData | Document ID and authenticated organization ID |
| expectedResult | Referenced document belongs to the same tenant and is not deleted |
| failureMessage | Referenced document is unavailable |
| exceptions | Optional absent document ID does not claim verification |
| configurationKey | `otec.documents.ownershipRequired` |
| testCases | Same tenant; foreign tenant; missing; deleted; omitted optional document |
| validationStatus | `FUNCTIONALLY_VALIDATED` as product security behavior |

### OTEC-TENANT-001 — Tenant reference integrity

| Field | Value |
|---|---|
| category | `TENANT_SECURITY` |
| applicableModality | `ALL` |
| sourceReference/sourceVersion | Internal security requirement / `1.0` |
| severity | `BLOCKING` |
| inputData | Authenticated tenant and all referenced entity tenant IDs |
| expectedResult | Every record/reference belongs to the authenticated tenant |
| failureMessage | Referenced resource is unavailable |
| exceptions | None |
| configurationKey | None; mandatory invariant |
| testCases | Same tenant; cross-tenant parent/document/supersession; list isolation |
| validationStatus | `FUNCTIONALLY_VALIDATED` |

### OTEC-DATE-001 — Valid effective date range

| Field | Value |
|---|---|
| category | `DATA_INTEGRITY` |
| applicableModality | `ALL` |
| sourceReference/sourceVersion | Internal product invariant / `1.0` |
| severity | `BLOCKING` |
| inputData | validFrom and validUntil |
| expectedResult | Missing endpoints are handled by configuration; when both exist, validFrom ≤ validUntil |
| failureMessage | Effective date range is invalid |
| exceptions | Same-day range is permitted unless later validated otherwise |
| configurationKey | `otec.validity.undatedTreatment` |
| testCases | Ordered; equal; reversed; missing start; missing end |
| validationStatus | `FUNCTIONALLY_VALIDATED` as product behavior |

### OTEC-VERSION-001 — Expected-version mutation

| Field | Value |
|---|---|
| category | `CONCURRENCY` |
| applicableModality | `ALL` |
| sourceReference/sourceVersion | Internal integrity requirement / `1.0` |
| severity | `BLOCKING` |
| inputData | Tenant, entity ID, persisted version, expected version |
| expectedResult | Mutation affects exactly one current tenant-scoped row and increments version atomically |
| failureMessage | Record changed since it was read |
| exceptions | Creation starts at version 1 |
| configurationKey | None; mandatory invariant |
| testCases | Current version; stale version; foreign tenant; deleted record; concurrent updates |
| validationStatus | `FUNCTIONALLY_VALIDATED` |

## Warning Windows

Default query/evaluation windows are 7, 15, 30, and 60 days. They are configuration defaults rather than regulatory deadlines. Evaluation records which configured window matched and never changes a blocking failure into READY based on score.

## Readiness Evaluation Semantics

`READY`, `READY_WITH_WARNINGS`, and `NOT_READY` describe only internal preparation readiness based on tenant-scoped records and the effective SkillFlow AI policy. They do not represent official approval, accreditation, authorization, documentary validation, or communication with SENCE, RUDO, OTIC, or LCE.

Validity boundaries are inclusive UTC calendar dates because regulatory validity is persisted as PostgreSQL `DATE`: a record is effective throughout its `validFrom` and `validUntil` dates and becomes ineffective on the following UTC calendar day. Open validity boundaries follow the effective `undatedRecordTreatment` policy:

- `BLOCKING`: undated evidence does not satisfy the requirement.
- `WARNING`: undated evidence satisfies the requirement with attention required.
- `ACCEPTED`: undated evidence satisfies the requirement without an expiration warning.

When multiple records exist, one current qualifying record is sufficient. Invalid alternatives do not negate valid evidence. A superseded resolution never qualifies; only an active terminal resolution of each configured required type can satisfy `OTEC-RES-001`.

Every finding includes its stable rule code, category, severity, entity reference when available, evaluated timestamp, validity evidence, message, and remediation. Score remains informational and cannot override a blocking finding.

## Change Control

Every rule change requires a new source/effective version, specification/test update, traceability entry, and functional validation decision. Historical evaluations select the version effective at the evaluation date. Superseded rule versions remain auditable.
