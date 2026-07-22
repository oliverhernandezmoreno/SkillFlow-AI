# Demo Profile 403 Root Cause and Fix

- Date: 2026-07-22
- Change: `add-otec-compliance-foundation`
- Agent: Codex

## Proven Root Cause

The demo tenant received the OTEC Compliance entitlement and permissions while remaining organization type `CLIENT_COMPANY`. After HTTP and application permission authorization succeeded, `CreateOtecProfileUseCase.execute` rejected the tenant at `create-otec-profile.use-case.ts:35` with `ForbiddenError("An active OTEC organization is required")`. `mapOtecHttpError` intentionally sanitized every forbidden application error to the public body `FORBIDDEN / Permission denied`.

## RED Evidence

- Original class: `ForbiddenError`
- Original message: `An active OTEC organization is required`
- Origin: `CreateOtecProfileUseCase.execute` at `create-otec-profile.use-case.ts:35:13`
- Pre-handler stack continued through `otec-profile.controller.ts:33:20`
- Final body: `{ "error": { "code": "FORBIDDEN", "message": "Permission denied" } }`
- Exact integration test: 1 failed, exit code 1

## Minimal Correction

The existing idempotent OTEC permission/entitlement seed now sets the selected active organization to type `OTEC` within the same transaction before granting access. The use-case eligibility rule, authorization rules, JWT behavior, and public error contract remain unchanged.

## GREEN Evidence

- Exact productive-stack integration: 3 passed, exit code 0
- Seed/bootstrap focused regression: 8 passed, exit code 0
- Full backend suite: 427 passed across 49 files, exit code 0
- Build/typecheck: exit code 0
- Lint: exit code 0
- Prisma validation: exit code 0
- OpenSpec strict validation: exit code 0
- Diff check and temporary diagnostic marker scan: exit code 0

The integration proves allowed creation, missing-permission 403, and isolation between authenticated tenants. All temporary middleware, policy, helper, logger, and diagnostic-test instrumentation was removed.
