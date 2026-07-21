# OTEC Application Hardening Initial Matrix

**Canonical scope:** 7.11.1–7.11.4 and the backend-only portions 8.5.1–8.6.2. HTTP tasks 8.1–8.4 remain unstarted.

| # | Use case | Type | Entitlement before hardening | Expected permission | Transaction / atomic audit | Initial gap |
|---:|---|---|---|---|---|---|
| 1 | CreateOtecProfile | Command | Missing | `otec_compliance.profile.manage` | No / No | Entitlement, RBAC, transaction, atomicity |
| 2 | GetOtecProfile | Query | Missing | `otec_compliance.read` | N/A | Entitlement and RBAC |
| 3 | UpdateOtecProfile | Command | Missing | `otec_compliance.profile.manage` | No / No | Entitlement, RBAC, transaction, atomicity |
| 4 | DeactivateOtecProfile | Command | Missing | `otec_compliance.profile.manage` | No / No | Entitlement, RBAC, transaction, atomicity |
| 5 | CreateOtecAccreditation | Command | Missing | `otec_compliance.accreditation.manage` | Yes / Yes | Entitlement and RBAC |
| 6 | ListOtecAccreditations | Query | Missing | `otec_compliance.read` | N/A | Entitlement and RBAC |
| 7 | GetOtecAccreditation | Query | Missing | `otec_compliance.read` | N/A | Entitlement and RBAC |
| 8 | UpdateOtecAccreditation | Command | Missing | `otec_compliance.accreditation.manage` | Yes / Yes | Entitlement and RBAC |
| 9 | SuspendOtecAccreditation | Command | Missing | `otec_compliance.accreditation.manage` | Yes / Yes | Entitlement and RBAC |
| 10 | RevokeOtecAccreditation | Command | Missing | `otec_compliance.accreditation.manage` | Yes / Yes | Entitlement and RBAC |
| 11 | CreateQualityCertification | Command | Missing | `otec_compliance.certification.manage` | Yes / Yes | Entitlement and RBAC |
| 12 | ListQualityCertifications | Query | Missing | `otec_compliance.read` | N/A | Entitlement and RBAC |
| 13 | GetQualityCertification | Query | Missing | `otec_compliance.read` | N/A | Entitlement and RBAC |
| 14 | UpdateQualityCertification | Command | Missing | `otec_compliance.certification.manage` | Yes / Yes | Entitlement and RBAC |
| 15 | DeactivateQualityCertification | Command | Missing | `otec_compliance.certification.manage` | Yes / Yes | Entitlement and RBAC |
| 16 | CreateOtecOffice | Command | Present | `otec_compliance.office.manage` | Yes / Yes | RBAC |
| 17 | ListOtecOffices | Query | Present | `otec_compliance.read` | N/A | RBAC |
| 18 | GetOtecOffice | Query | Present | `otec_compliance.read` | N/A | RBAC |
| 19 | UpdateOtecOffice | Command | Present | `otec_compliance.office.manage` | Yes / Yes | RBAC |
| 20 | DeactivateOtecOffice | Command | Present | `otec_compliance.office.manage` | Yes / Yes | RBAC |
| 21 | CreateLegalRepresentative | Command | Present | `otec_compliance.representative.manage` | Yes / Yes | RBAC |
| 22 | ListLegalRepresentatives | Query | Present | `otec_compliance.read` | N/A | RBAC |
| 23 | GetLegalRepresentative | Query | Present | `otec_compliance.read` | N/A | RBAC |
| 24 | UpdateLegalRepresentative | Command | Present | `otec_compliance.representative.manage` | Yes / Yes | RBAC |
| 25 | DeactivateLegalRepresentative | Command | Present | `otec_compliance.representative.manage` | Yes / Yes | RBAC |
| 26 | CreateOtecResolution | Command | Present | `otec_compliance.resolution.manage` | Yes / Yes | RBAC |
| 27 | ListOtecResolutions | Query | Present | `otec_compliance.read` | N/A | RBAC |
| 28 | GetOtecResolution | Query | Present | `otec_compliance.read` | N/A | RBAC |
| 29 | UpdateOtecResolution | Command | Present | `otec_compliance.resolution.manage` | Yes / Yes | RBAC |
| 30 | SupersedeOtecResolution | Command | Present | `otec_compliance.resolution.manage` | Yes / Yes | RBAC |
| 31 | DeactivateOtecResolution | Command | Present | `otec_compliance.resolution.manage` | Yes / Yes | RBAC |
| 32 | EvaluateOtecReadiness | Query | Present | `otec_compliance.readiness.evaluate` | N/A | RBAC |
| 33 | GetOtecComplianceSummary | Query | Present via Evaluate | `otec_compliance.read` | N/A | RBAC projection contract |
| 34 | GetExpiringComplianceItems | Query | Present | `otec_compliance.read` | N/A | RBAC |
| 35 | ValidateOtecCanPrepareSenceActivity | Query | Present via Evaluate | `otec_compliance.readiness.evaluate` | N/A | RBAC projection contract |
| 36 | ActivateOtecProfile | Command | N/A | N/A | N/A | NOT_APPLICABLE: no canonical operation; adding it would expand scope |

No initial operation was fully compliant: the 35 existing operations lacked application-level RBAC, and three slices also lacked entitlement composition. Profile commands additionally lacked atomic audit persistence.
