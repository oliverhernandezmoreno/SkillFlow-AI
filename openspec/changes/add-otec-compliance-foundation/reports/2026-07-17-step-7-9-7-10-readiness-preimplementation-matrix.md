# Steps 7.9–7.10 Readiness Pre-implementation Matrix

## Scope and Meaning

Readiness means only that, according to internal records and effective SkillFlow AI configuration, the organization satisfies the internal prerequisites for preparing an OTEC/SENCE-associated operation. It is not official SENCE approval, accreditation, authorization, connectivity, or documentary validation.

## Rule Matrix

| Rule | Source aggregate | READY condition | WARNING condition | BLOCKING condition | Evidence |
| --- | --- | --- | --- | --- | --- |
| `OTEC-FOUND-001` | Organization projection | Same authorized organization is active and type OTEC | None | Organization missing, inactive, suspended, or not OTEC | Organization ID/type/status from tenant-scoped read port |
| `OTEC-FOUND-002` | OtecProfile | Same-tenant, non-deleted profile is active | Optional complementary data remains outside blocking policy | Profile missing, foreign, deleted, inactive, suspended, or ceased | Profile ID/status from requested profile lookup |
| `OTEC-ACC-001` | OtecAccreditation | At least one active record is effective at evaluation time | Qualifying record expires inside configured window or undated policy is WARNING | No qualifying record; only suspended, revoked, future, expired, deleted, or foreign records; undated policy BLOCKING | Status, validity, ID from snapshot |
| `OTEC-QUAL-001` | QualityCertification | Required NCH_2728 evidence is active/effective, or policy marks it optional | Required qualifying record expires soon or undated policy is WARNING | Required evidence is missing, inactive, future, expired, deleted, or foreign; undated policy BLOCKING | Effective policy plus type/status/validity/ID |
| `OTEC-OFF-001` | OtecOffice | At least one configured qualifying office type is active/effective | Qualifying office expires soon or undated policy is WARNING | No active/effective configured type; only invalid, deleted, or foreign offices | Configured types plus office type/status/validity/ID |
| `OTEC-REP-001` | LegalRepresentative | At least one active/effective representative exists | Qualifying representative expires soon or undated policy is WARNING | No qualifying representative; only inactive, future, expired, deleted, or foreign records | Active flag, validity, ID |
| `OTEC-RES-001` | OtecResolution | A current active terminal resolution exists for every configured required type | Terminal qualifying resolution expires soon or undated policy is WARNING | Required terminal evidence missing; only inactive, future, expired, deleted, foreign, or superseded evidence | Required types, status, validity, predecessor/terminal state, ID |

## Temporal and Consistency Decisions

- `validFrom` and `validUntil` are inclusive.
- A record is ineffective immediately after `validUntil`.
- An absent `validUntil` remains current unless the effective undated policy makes open-ended evidence warning or blocking.
- The application clock supplies the default evaluation time; an explicit evaluation time overrides it.
- The effective settings row is the latest non-deleted same-tenant/profile row whose interval contains the evaluation time.
- The snapshot adapter will use a bounded repeatable-read transaction. Entitlement remains a separate authorization query before snapshot loading.

## Concrete Inconsistencies to Resolve

1. `undatedRecordTreatment` exists in persistence and the snapshot contract but is not evaluated.
2. Findings lack category and their own evaluation timestamp.
3. The result lacks organization/profile/policy identity and a consolidated findings collection.
4. No application port currently composes an effective, tenant-scoped, soft-delete-aware readiness snapshot.
5. Current tests cover individual rules but not the authorized 18-scenario integral matrix or the application orchestration boundary.

No broad aggregate refactor or migration is justified by these findings.
