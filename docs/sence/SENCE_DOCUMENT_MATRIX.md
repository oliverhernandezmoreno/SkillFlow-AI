# SENCE and OTEC Document Matrix

## Status Legend

- **Phase 1 reference:** An optional Document ID may be associated and same-tenant ownership checked.
- **Future required:** The future workflow is expected to need an artifact, subject to functional validation.
- **Not implemented:** No document platform behavior exists.

Document presence does not prove authenticity, official acceptance, signature validity, or regulatory sufficiency.

| Area | Document/evidence type | Owner/issuer | Phase 1 usage | Required metadata | Integrity/lifecycle needs | Validation status |
|---|---|---|---|---|---|---|
| OTEC profile | Registry/accreditation evidence | OTEC/SENCE or authorized source | Optional reference | Type, source, date, reference, tenant | Checksum, secure storage, version, access | Requires functional validation |
| Accreditation | Accreditation act/certificate | Issuing authority | Optional reference/future field | Number, authority, issued/effective dates, status | Expiry, suspension/revocation evidence | Requires functional validation |
| Quality | NCh2728 certificate | Certifying entity | `documentId` proposed | Number, certifier, scope, dates, certification type | Verification, replacement history, expiry alert | Requires functional validation |
| Office | Address/tenure/approval evidence | OTEC/authority | Not required in Phase 1 | Office type/address/effective date | PII/access controls, version | Requires functional validation |
| Representative | Appointment/power document | Organization/notary/authority | `appointmentDocumentId` proposed | Representative, role, dates, source | Restricted access, expiry, supersession | Requires functional validation |
| Resolution | Administrative resolution | Issuing authority | `documentId` proposed | Type, number, authority, dates, scope | Supersession chain, immutable version | Requires functional validation |
| Course | Course authorization/code evidence | Applicable authority | Future | Course/code/version/modality/hours/dates | Version and effective-date linkage | Requires functional validation |
| Activity | Communication payload/receipt | Operator/external system | Not implemented | Activity/version/participants/times/folio | Immutable request/response and idempotency | Requires functional validation |
| Participant | Eligibility/contract evidence | Employer/participant | Not implemented | Identity, relation, applicable dates | High privacy, retention, minimization | Requires functional validation |
| Attendance | LCE attendance certificate | Applicable LCE process | Not implemented | Activity/block/participant/hours/source | Official source verification, immutable storage | Requires functional validation |
| E-learning | Connectivity records | Platform/control system | Not implemented | Sessions, timestamps, participant, course | Volume, integrity, retention, reconciliation | Requires functional validation |
| Evaluation | Assessment/result evidence | OTEC/instructor | Existing data, document absent | Evaluation version, response, score, close time | Immutable closed version, restricted answers | Product behavior + future validation |
| Certificate | Training certificate PDF/QR/signature | OTEC | Metadata stub only | Template/version, signer, issued date, verification | Rendering, signature, QR, revocation, delivery | Not implemented |
| Sworn statement | OTEC declaration | Authorized OTEC representative | Not implemented | Signer, capacity, activity, date | Electronic signature, timestamp, retention | Requires functional validation |
| Sworn statement | Participant declaration | Participant | Not implemented | Participant, activity, date, consent | Signature, privacy, delivery evidence | Requires functional validation |
| Finance | Invoice/payment evidence | Provider/financial institution | Document type exists only | Invoice, payment, amounts, dates | Access, reconciliation, retention | Requires functional validation |
| Pre-liquidation | Package/receipt | Operator/external party | Not implemented | Manifest, payload version, outcome | Immutable request/response | Requires functional validation |
| Liquidation | Final package/receipt | Operator/external party | Not implemented | Amounts, decision, folio, timestamps | Reconciliation, legal retention | Requires functional validation |
| Observation | Observation notice | External/internal reviewer | Not implemented structurally | Source, code, description, deadline | Version, access, link to rectification | Requires functional validation |
| Rectification | Corrected payload/receipt | Operator/external party | Not implemented | Prior/new versions, reason, approval | Immutable diffs, idempotency | Requires functional validation |

## Phase 1 Ownership Check

When a Phase 1 record declares a document ID, `TenantDocumentOwnershipPort` must confirm that the Document exists, belongs to the authenticated organization, and is not deleted. Failure is non-disclosing. Phase 1 does not read document content or claim that the file is complete, authentic, malware-free, signed, current, or accepted.

## Future Document Platform Requirements

- Object storage and signed access.
- Upload size/type controls and malware scanning.
- Cryptographic checksum and immutable version manifest.
- Document status, review, expiry, supersession, and retention.
- Field-level permissions and PII classification.
- Signature and timestamp verification.
- Dossier completeness rules by process/modality/effective rule version.
- Export packages with manifests and audit evidence.

