# OTEC Internal Readiness Evaluation

## Purpose

OTEC readiness reports whether internal, tenant-scoped SkillFlow AI records satisfy the effective configured prerequisites for preparing an OTEC/SENCE-associated operation. It does not represent official approval, accreditation, authorization, document verification, or communication with SENCE, RUDO, OTIC, or LCE.

## Outcomes

- `READY`: every blocking rule has qualifying internal evidence and no warning applies.
- `READY_WITH_WARNINGS`: every blocking rule passes, but at least one qualifying item is near expiration or has an open validity boundary treated as a warning.
- `NOT_READY`: at least one blocking rule lacks qualifying evidence. Score cannot override this result.

## Result Contract

The domain result identifies the organization, OTEC profile, evaluation timestamp, effective policy version, status, informational score, blocking findings, warnings, passed rules, all findings, expiring items, missing items, and internal-only metadata.

Each finding contains:

- stable internal `ruleCode` and category; the HTTP presenter exposes that identifier exclusively as the public `code` property;
- severity;
- entity type and optional entity ID;
- message and remediation;
- validity boundaries and days until expiration when calculable;
- the evaluation timestamp.

## Effective-Time Policy

Evaluation is deterministic for its supplied timestamp. When no timestamp is supplied, the application uses an injected clock. Both `validFrom` and `validUntil` are inclusive UTC calendar dates, matching their PostgreSQL `DATE` persistence. A record stops qualifying on the calendar day after `validUntil`.

Open validity boundaries follow the effective tenant policy: `BLOCKING`, `WARNING`, or `ACCEPTED`. Warning windows are configuration, not regulatory deadlines.

## Snapshot and Tenant Isolation

The application obtains one snapshot through `OtecReadinessSnapshotReadPort`. The Prisma adapter constrains every query by authenticated `organizationId`, requested `otecProfileId`, and `deletedAt: null`. A foreign profile returns no snapshot and foreign or deleted evidence cannot appear in findings.

The adapter selects the latest effective non-deleted settings row for the evaluation timestamp and uses a bounded `REPEATABLE READ` transaction. It makes eight projection queries inside that snapshot plus the preceding entitlement query. No Prisma type enters application or domain code.

## Resolution Supersession

Only active terminal resolutions count. A resolution marked `SUPERSEDED`, or one with a non-deleted successor, is historical evidence and cannot satisfy readiness. Write-side repository rules prevent self-links, cross-tenant links, cycles, and concurrent double replacement.

## Current Limitations

- Regulatory applicability values remain internally configurable and may require functional validation.
- Historical evaluation uses effective dates and retained records; it is not full bitemporal history after in-place edits.
- The snapshot currently loads all non-deleted records for one profile. Projection filtering should be considered only after measuring larger histories.
- Summary, expiration-listing, activity-preparation, HTTP, and frontend contracts are separate OpenSpec deliverables.
