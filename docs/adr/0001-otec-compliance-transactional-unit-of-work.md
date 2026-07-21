# ADR 0001: OTEC Compliance Transactional Unit of Work

- Status: Accepted
- Date: 2026-07-16
- Change: `add-otec-compliance-foundation`

## Context

OTEC Compliance critical mutations require the regulatory record and its `AuditEvent` to commit or roll back together. Existing repositories and `PrismaAuditLogger` each used the root `PrismaClient`, so sequential application calls could persist a mutation before a later audit failure.

The immediate requirement is a minimal transaction foundation for accreditation use cases. The solution must preserve existing standalone repository and audit consumers and must not introduce event delivery infrastructure.

## Decision

Define two application contracts:

- `UnitOfWork` identifies dependencies that share one transaction boundary.
- `TransactionManager<TUnitOfWork>` runs a callback and returns its result only after commit.

Define an OTEC Compliance unit of work containing only:

- `OtecAccreditationRepository`;
- `AuditLogger`.

`PrismaOtecComplianceTransactionManager` opens `PrismaClient.$transaction()`, creates both adapters with the same `Prisma.TransactionClient`, and invokes the callback. Any repository or audit exception escapes the callback and Prisma rolls back every write in that boundary.

Existing constructors retain their root `PrismaClient` defaults. Only the accreditation repository and audit adapter widen their constructor dependency to `PrismaClient | Prisma.TransactionClient`, preserving current call sites.

## Consequences

- Accreditation use cases can persist a critical mutation and its audit atomically.
- Application code depends on typed ports and does not import Prisma.
- The transaction lifetime is explicit and limited to the callback.
- Callers must use dependencies supplied by the unit of work; mixing root-client adapters inside the callback is not transactional.
- Additional OTEC repositories may be added to the unit of work only when a concrete critical workflow requires them.
- Existing non-OTEC consumers remain behaviorally unchanged.

## Verification

PostgreSQL integration tests prove:

- a successful accreditation and audit commit together;
- a real audit foreign-key failure rolls back the preceding accreditation insert;
- no audit or accreditation row remains after rollback.

## Explicit Non-Goals

- Outbox pattern;
- event bus;
- domain or integration events;
- CQRS;
- messaging;
- background workers;
- retries or distributed transactions;
- external SENCE, RUDO, OTIC, or LCE integration.
