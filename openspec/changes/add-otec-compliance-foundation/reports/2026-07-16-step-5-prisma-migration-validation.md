# Step 5: Prisma Migration Validation

## Scope

Validated the additive OTEC Compliance foundation migration against the project PostgreSQL 16 container. The database is local and disposable; no production or shared environment was contacted.

## Commands and Results

- `npx vitest run src/modules/otec-compliance/infrastructure/prisma/otec-compliance-schema.test.ts --config vitest.config.ts`: 10 tests passed.
- `npx prisma validate`: schema valid.
- `npx prisma migrate reset --force --skip-seed`: all five historical and new migrations applied successfully from an empty database.
- PostgreSQL catalog query: all six expected partial unique indexes exist.

## Integrity Decisions

- All new records are organization-owned and mutable records carry soft-delete and optimistic-version fields.
- Profile-child foreign keys include `organization_id`, preventing a child record from referencing a profile owned by another tenant.
- Resolution supersession uses a globally unique UUID foreign key; same-tenant/profile and cycle invariants remain application and repository responsibilities and require integration tests.
- Partial unique indexes preserve reusable business identifiers after soft deletion while preventing duplicate active records.
- Historical migrations were not modified.

## Rollback Limitations

Prisma does not generate or execute automatic down migrations. Operational rollback requires a separately reviewed forward migration that removes constraints, indexes, tables, and enum types in dependency order. Dropping these structures is destructive and would discard OTEC Compliance data; therefore rollback must include an export/backup and explicit change approval. Application rollback is safe only while the additive tables remain in place and the module entitlement stays unavailable.
