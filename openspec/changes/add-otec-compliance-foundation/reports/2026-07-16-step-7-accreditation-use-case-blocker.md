# Step 7 Accreditation Use-Case Blocker

- Date: 2026-07-16
- Change: `add-otec-compliance-foundation`
- Scope: OpenSpec tasks 7.3–7.4 only
- Outcome: BLOCKED before RED implementation

## Required Guarantee

Critical accreditation mutations and their audit events must commit atomically. If audit persistence fails, creation, update, suspension, or revocation must not remain persisted.

This requirement is stated in the approved design under **Audit consistency strategy** and was reiterated by the authorized task checkpoint.

## Repository Evidence

- `AuditLogger.record()` exposes an independent persistence operation and has no transaction context.
- `PrismaAuditLogger` owns a `PrismaClient` and calls `auditEvent.create()` directly.
- `PrismaOtecAccreditationRepository` performs `create()` and `updateMany()` through its own Prisma delegate.
- No `UnitOfWork`, transaction-aware audit port, transaction client factory, or `withTransaction` application contract exists in `src/`.
- OpenSpec task 7.11 explicitly schedules transaction-aware critical audit persistence after tasks 7.3–7.10.

Therefore, a use case implemented with the current contracts would persist the accreditation first and audit second. An audit failure would leave a partially applied critical operation. Catching the audit error, retrying independently, or adding mock-only rollback behavior would conceal rather than satisfy the requirement.

## Additional Domain Gap

`OtecAccreditation.suspend()` and `revoke()` currently apply transitions without checking the source state. The entity also has no general update behavior. These gaps are implementable within tasks 7.3–7.4, but doing so before resolving atomic persistence would still leave the mandatory transaction scenario unsatisfied.

## Decision

**NO-GO for tasks 7.3–7.4 with the current dependency order.** No accreditation use-case test or implementation was added, and tasks 7.3–7.4 remain incomplete.

Required resolution: authorize bringing the transaction-aware unit-of-work portion of task 7.11 forward as a prerequisite, or revise the approved sequencing with an equivalent transaction contract. HTTP, routes, frontend, external integrations, migrations, commits, pushes, tags, and deployments remain out of scope.

## Resolution

Partial authorization was granted to implement OpenSpec task 7.2.5, **Transactional Infrastructure Foundation**, without implementing task 7.11 as a whole. The resulting typed unit-of-work boundary and PostgreSQL rollback evidence remove this prerequisite blocker once all 7.2.5 quality gates pass. Tasks 7.3–7.4 remain intentionally unstarted pending the required checkpoint.
