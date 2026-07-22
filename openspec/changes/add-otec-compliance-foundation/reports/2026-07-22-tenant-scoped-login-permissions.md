# Tenant-Scoped Login Permissions Verification

- Date: 2026-07-22
- Change: `add-otec-compliance-foundation`
- Agent: Codex

## Root Cause

`LoginUseCase` requested permission codes using only the user identifier. The Prisma query filtered soft-deleted authorization records but did not constrain `RolePermission`, `Role`, or nested `UserRole` records to the authenticated organization. JWT creation therefore received a permission set without an explicit tenant proof at the authorization query boundary.

## TDD Evidence

- RED command: `npx vitest run --config vitest.config.ts src/modules/auth/auth.test.ts src/modules/auth/infrastructure/prisma/prisma-auth-identity.repository.test.ts`
- RED result: 2 failed, 11 passed, exit code 1.
- Expected failures: login forwarded no organization identifier; the Prisma query omitted organization predicates at the role-permission, role, and user-role levels.
- GREEN focused result: 13 passed, 0 failed across 2 files, exit code 0.
- Authorization-focused result: 43 passed, 0 failed across 5 files, exit code 0.

## Implementation

- The repository contract now requires `userId` and `organizationId`.
- Login forwards the authenticated user's identifier and organization identifier.
- The Prisma query requires matching `organizationId` on `RolePermission`, `Role`, and nested active `UserRole` records.
- Existing `deletedAt: null` predicates remain on `RolePermission`, `Role`, `UserRole`, and `Permission`.
- Duplicate permission codes remain removed with `Set` before JWT creation.
- JWT and OTEC authorization implementations were not changed.

## Validation Results

- Focused auth and repository tests: 13 passed, 0 failed; exit code 0.
- Focused auth and OTEC authorization tests: 43 passed, 0 failed; exit code 0.
- Full backend regression: 424 passed, 0 failed across 48 files; exit code 0.
- TypeScript strict build (`npm run build`): exit code 0.
- Lint (`npm run lint`): exit code 0.
- Prisma validation (`npm run prisma:validate`): exit code 0.
- OpenSpec strict validation: exit code 0.
- Diff whitespace check (`git diff --check`): exit code 0.
- Broken symlink scan: no broken symlinks reported.

The full regression included PostgreSQL-backed OTEC repository, transaction, seed, query, snapshot, and HTTP E2E suites. Those suites completed their existing deterministic cleanup paths. No production or demo data was inserted or altered manually.

## Security Review

- No authorization bypass was added.
- No OTEC permission code or authorization policy changed.
- No frontend file changed.
- No historical migration or Prisma schema changed.
- No commit, push, merge, tag, or deployment was performed.

## Residual Risk

Permission claims remain valid until the issued JWT expires or is refreshed. Immediate claim revocation after a role or permission change remains outside this focused correction.
