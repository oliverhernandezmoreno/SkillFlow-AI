# OTEC Compliance Productive HTTP Endpoint Inventory

All paths are relative to `/api/v1/otec-compliance`. Input and output DTOs are the strict Zod transport schemas and the approved OTEC presenter. Authentication supplies `UseCaseContext`; no endpoint accepts tenant or actor identity.

| Endpoint | Use case | Controller | Route | Input | Output | Permission | Entitlement | Concurrency | State |
|---|---|---|---|---|---|---|---|---|---|
| `POST /profile` | CreateOtecProfile | Profile | profile | CreateProfileBody | ProfileResponse | `otec_compliance.profile.manage` | profile | response ETag | READY_TO_IMPLEMENT |
| `GET /profile` | GetOtecProfile | Profile | profile | none | ProfileResponse | `otec_compliance.read` | profile | response ETag | READY_TO_IMPLEMENT |
| `PATCH /profile` | UpdateOtecProfile | Profile | profile | UpdateProfileBody | ProfileResponse | `otec_compliance.profile.manage` | profile | If-Match/ETag | READY_TO_IMPLEMENT |
| `POST /profile/deactivation` | DeactivateOtecProfile | Profile | profile | TransitionBody | no body (204) | `otec_compliance.profile.manage` | profile | If-Match | READY_TO_IMPLEMENT |
| `POST /accreditations` | CreateOtecAccreditation | Accreditation | accreditations | CreateAccreditationBody | AccreditationResponse | `otec_compliance.accreditation.manage` | accreditations | response ETag | READY_TO_IMPLEMENT |
| `GET /accreditations` | ListOtecAccreditations | Accreditation | accreditations | ListQuery | PageResponse | `otec_compliance.read` | accreditations | none | READY_TO_IMPLEMENT |
| `GET /accreditations/:id` | GetOtecAccreditation | Accreditation | accreditations | IdParam | AccreditationResponse | `otec_compliance.read` | accreditations | response ETag | READY_TO_IMPLEMENT |
| `PATCH /accreditations/:id` | UpdateOtecAccreditation | Accreditation | accreditations | UpdateAccreditationBody | AccreditationResponse | `otec_compliance.accreditation.manage` | accreditations | If-Match/ETag | READY_TO_IMPLEMENT |
| `POST /accreditations/:id/suspension` | SuspendOtecAccreditation | Accreditation | accreditations | TransitionBody | AccreditationResponse | `otec_compliance.accreditation.manage` | accreditations | If-Match/ETag | READY_TO_IMPLEMENT |
| `POST /accreditations/:id/revocation` | RevokeOtecAccreditation | Accreditation | accreditations | TransitionBody | AccreditationResponse | `otec_compliance.accreditation.manage` | accreditations | If-Match/ETag | READY_TO_IMPLEMENT |
| `POST /quality-certifications` | CreateQualityCertification | Certification | quality-certifications | CreateCertificationBody | CertificationResponse | `otec_compliance.certification.manage` | certifications | response ETag | READY_TO_IMPLEMENT |
| `GET /quality-certifications` | ListQualityCertifications | Certification | quality-certifications | ListQuery | PageResponse | `otec_compliance.read` | certifications | none | READY_TO_IMPLEMENT |
| `GET /quality-certifications/:id` | GetQualityCertification | Certification | quality-certifications | IdParam | CertificationResponse | `otec_compliance.read` | certifications | response ETag | READY_TO_IMPLEMENT |
| `PATCH /quality-certifications/:id` | UpdateQualityCertification | Certification | quality-certifications | UpdateCertificationBody | CertificationResponse | `otec_compliance.certification.manage` | certifications | If-Match/ETag | READY_TO_IMPLEMENT |
| `POST /quality-certifications/:id/deactivation` | DeactivateQualityCertification | Certification | quality-certifications | TransitionBody | CertificationResponse | `otec_compliance.certification.manage` | certifications | If-Match/ETag | READY_TO_IMPLEMENT |
| `POST /offices` | CreateOtecOffice | Office | offices | CreateOfficeBody | OfficeResponse | `otec_compliance.office.manage` | offices | response ETag | READY_TO_IMPLEMENT |
| `GET /offices` | ListOtecOffices | Office | offices | ListQuery | PageResponse | `otec_compliance.read` | offices | none | READY_TO_IMPLEMENT |
| `GET /offices/:id` | GetOtecOffice | Office | offices | IdParam | OfficeResponse | `otec_compliance.read` | offices | response ETag | READY_TO_IMPLEMENT |
| `PATCH /offices/:id` | UpdateOtecOffice | Office | offices | UpdateOfficeBody | OfficeResponse | `otec_compliance.office.manage` | offices | If-Match/ETag | READY_TO_IMPLEMENT |
| `POST /offices/:id/deactivation` | DeactivateOtecOffice | Office | offices | TransitionBody | OfficeResponse | `otec_compliance.office.manage` | offices | If-Match/ETag | READY_TO_IMPLEMENT |
| `POST /legal-representatives` | CreateLegalRepresentative | Representative | legal-representatives | CreateRepresentativeBody | RepresentativeResponse | `otec_compliance.representative.manage` | representatives | response ETag | READY_TO_IMPLEMENT |
| `GET /legal-representatives` | ListLegalRepresentatives | Representative | legal-representatives | ListQuery | PageResponse | `otec_compliance.read` | representatives | none | READY_TO_IMPLEMENT |
| `GET /legal-representatives/:id` | GetLegalRepresentative | Representative | legal-representatives | IdParam | RepresentativeResponse | `otec_compliance.read` | representatives | response ETag | READY_TO_IMPLEMENT |
| `PATCH /legal-representatives/:id` | UpdateLegalRepresentative | Representative | legal-representatives | UpdateRepresentativeBody | RepresentativeResponse | `otec_compliance.representative.manage` | representatives | If-Match/ETag | READY_TO_IMPLEMENT |
| `POST /legal-representatives/:id/deactivation` | DeactivateLegalRepresentative | Representative | legal-representatives | TransitionBody | RepresentativeResponse | `otec_compliance.representative.manage` | representatives | If-Match/ETag | READY_TO_IMPLEMENT |
| `POST /resolutions` | CreateOtecResolution | Resolution | resolutions | CreateResolutionBody | ResolutionResponse | `otec_compliance.resolution.manage` | resolutions | response ETag | READY_TO_IMPLEMENT |
| `GET /resolutions` | ListOtecResolutions | Resolution | resolutions | ListQuery | PageResponse | `otec_compliance.read` | resolutions | none | READY_TO_IMPLEMENT |
| `GET /resolutions/:id` | GetOtecResolution | Resolution | resolutions | IdParam | ResolutionResponse | `otec_compliance.read` | resolutions | response ETag | READY_TO_IMPLEMENT |
| `PATCH /resolutions/:id` | UpdateOtecResolution | Resolution | resolutions | UpdateResolutionBody | ResolutionResponse | `otec_compliance.resolution.manage` | resolutions | If-Match/ETag | READY_TO_IMPLEMENT |
| `POST /resolutions/:id/supersession` | SupersedeOtecResolution | Resolution | resolutions | SupersessionBody | SupersessionResponse | `otec_compliance.resolution.manage` | resolutions | two If-Match versions/ETag | READY_TO_IMPLEMENT |
| `POST /resolutions/:id/deactivation` | DeactivateOtecResolution | Resolution | resolutions | TransitionBody | ResolutionResponse | `otec_compliance.resolution.manage` | resolutions | If-Match/ETag | READY_TO_IMPLEMENT |
| `POST /readiness/evaluations` | EvaluateOtecReadiness | Readiness | readiness | ReadinessBody | ReadinessResponse | `otec_compliance.readiness.evaluate` | readiness | none | READY_TO_IMPLEMENT |
| `GET /compliance-summary` | GetOtecComplianceSummary | Compliance | compliance-summary | EvaluationQuery | SummaryResponse | `otec_compliance.read` | readiness | none | READY_TO_IMPLEMENT |
| `GET /expiring-items` | GetExpiringComplianceItems | Expiration | expiring-items | ExpirationQuery | PageResponse | `otec_compliance.read` | expirations | none | READY_TO_IMPLEMENT |
| no public endpoint | ValidateOtecCanPrepareSenceActivity | none | none | none | none | `otec_compliance.readiness.evaluate` | readiness | none | INTERNAL_ONLY |
| no public endpoint | ActivateOtecProfile candidate | none | none | none | none | none | none | none | NOT_APPLICABLE |
| no public endpoint | standalone findings/blocking projections | none | none | none | none | `otec_compliance.read` | readiness | none | DEFERRED / SUPERSEDED_BY readiness |

No endpoint is currently blocked. Productive implementation must not add routes for the last three rows.

The profile rows are compatible with application after the singleton adaptation: Get receives context only; Update and Deactivate receive the approved mutable input/expected version plus context. No future profile controller needs a repository or caller-supplied profile identifier.

## Contractual hardening addendum

All 34 productive operations now use operation-specific OpenAPI request/response components. Strict request examples are fictitious and executable against the runtime Zod schemas. Response contracts exclude tenant, actor, and soft-delete infrastructure fields.

The create retry decision is `NOT_REQUIRED` for the current internal profile, accreditation, certification, office, and resolution creates because their existing singleton/partial-unique invariants produce deterministic conflict behavior. Legal representative create is `REQUIRED_BEFORE_EXTERNAL_CONSUMERS` because no equivalent retry identity prevents a duplicate after an unknown timeout. No endpoint currently claims persisted idempotency or accepts `Idempotency-Key`.

The stable status policy is 400 for malformed/invalid/non-stateful input and 409 for lifecycle, uniqueness, business-state, and stale-version conflicts. HTTP 412 and 422 are intentionally absent. `ValidateOtecCanPrepareSenceActivity` remains internal-only and has no productive route or OpenAPI operation.
