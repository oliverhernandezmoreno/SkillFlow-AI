# OTEC Compliance RBAC and Entitlement Matrix

## Evaluation Order

Every application operation validates authenticated tenant and actor context, evaluates `OTEC_COMPLIANCE` plus its feature, verifies the required permission, and only then loads a tenant-scoped resource or applies a domain rule. Entitlement controls commercial/module availability; RBAC controls actor authority. Neither substitutes for the other or for repository tenant predicates.

| Operations | Feature | Permission | Transaction and audit |
|---|---|---|---|
| Profile Get | `profile` | `otec_compliance.read` | Read-only |
| Profile Create/Update/Deactivate | `profile` | `otec_compliance.profile.manage` | Atomic unit of work and audit |
| Accreditation List/Get | `accreditations` | `otec_compliance.read` | Read-only |
| Accreditation Create/Update/Suspend/Revoke | `accreditations` | `otec_compliance.accreditation.manage` | Atomic unit of work and audit |
| Certification List/Get | `certifications` | `otec_compliance.read` | Read-only |
| Certification Create/Update/Deactivate | `certifications` | `otec_compliance.certification.manage` | Atomic unit of work and audit |
| Office List/Get | `offices` | `otec_compliance.read` | Read-only |
| Office Create/Update/Deactivate | `offices` | `otec_compliance.office.manage` | Atomic unit of work and audit |
| Representative List/Get | `representatives` | `otec_compliance.read` | Read-only |
| Representative Create/Update/Deactivate | `representatives` | `otec_compliance.representative.manage` | Atomic unit of work and audit |
| Resolution List/Get | `resolutions` | `otec_compliance.read` | Read-only |
| Resolution Create/Update/Supersede/Deactivate | `resolutions` | `otec_compliance.resolution.manage` | Atomic unit of work and audit |
| Compliance summary and expirations | `readiness` / `expirations` | `otec_compliance.read` | Read-only |
| Readiness evaluation and activity preparation | `readiness` | `otec_compliance.readiness.evaluate` | Read-only |

## Seed Strategy

`seedOtecCompliancePermissions` upserts eight global permission definitions and their assignments to a supplied existing role in one PostgreSQL transaction. The existing demo bootstrap invokes it for `demo-admin`; it creates no role, removes no permission, and is idempotent. Module entitlement remains disabled unless separately configured for the tenant.
