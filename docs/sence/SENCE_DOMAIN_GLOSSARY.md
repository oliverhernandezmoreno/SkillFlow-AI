# SENCE and OTEC Domain Glossary

## Usage Rules

This glossary supports internal product design. Definitions sourced from repository behavior are marked **Product**. Operational/regulatory terms are marked **Domain benchmark** and require functional validation before being encoded as official rules. A syntactically valid identifier never proves official validity.

| Term | Working definition | Status |
|---|---|---|
| SENCE | Chile's Servicio Nacional de Capacitación y Empleo. SkillFlow has no official SENCE connection. | Domain benchmark; validate current scope |
| OTEC | An organization operating as an Organismo Técnico de Capacitación. In SkillFlow, `Organization.type = OTEC` is only an internal classification. | Product + domain benchmark |
| OTIC | Organismo Técnico Intermedio para Capacitación. No OTIC entity or integration exists in SkillFlow. | Requires functional validation |
| RUDO | Registro Unificado de Organismos used for OTEC-related registry processes. A stored RUDO reference is not online verification. | Requires functional validation |
| NCh2728 | Quality-management certification associated with OTEC operation. Phase 1 records internal certification evidence and validity only. | Requires functional validation |
| Training action | A regulated/operational execution of training with participants, dates, modality, and evidence. It is not identical to the reusable Course catalog record. | Requires functional validation |
| Training activity | General term for a delivered training event. The precise distinction from “training action” depends on the applicable process. | Requires functional validation |
| Course | Reusable SkillFlow catalog definition containing code, name, modality, duration, and optional SENCE code. | Product |
| SENCE code | Identifier stored on a Course or declaration. Storage does not prove authorization, currency, or official validity. | Product; official meaning requires validation |
| Participant | Employee enrolled in a TrainingSession. Regulatory eligibility is not currently evaluated. | Product |
| Instructor | Person assigned to deliver a TrainingSession. “Relator” is the business-facing Chilean term used in product material. | Product |
| Office | OTEC-related headquarters, branch, operating office, training site, or other location recorded internally. Qualifying types require configuration. | Product proposal |
| Resolution | Administrative act recorded with number, authority, dates, status, scope, and optional supersession. Storage is not official validation. | Product proposal |
| Accreditation | Internal record of an OTEC-related accreditation period and lifecycle. It does not establish official accreditation. | Product proposal |
| Evidence | Data or document metadata supporting an internal check. Evidence presence does not establish authenticity or regulatory acceptance. | Product |
| Dossier | Grouped antecedents and evidence for a profile, action, participant, or process. A complete regulatory dossier is not implemented. | Requires functional validation |
| Communication | Process of reporting an activity/action to an applicable external party. Phase 1 does not implement it. | Requires functional validation |
| Rectification | Governed correction of previously communicated information. Not implemented. | Requires functional validation |
| Annulment | Governed cancellation of a communicated activity/action. Not implemented. | Requires functional validation |
| Pre-liquidation | A process preceding final liquidation. Exact data, evidence, and states are not encoded in Phase 1. | Requires functional validation |
| Liquidation | Process for completing/accrediting an activity for the applicable franchise workflow. Not implemented. | Requires functional validation |
| Class book | Record of classes, content, participants, instructors, and attendance. SkillFlow has no class-book aggregate. | Requires functional validation |
| LCE | Libro de Clases Electrónico. SkillFlow has no LCE integration or official LCE evidence. | Domain benchmark |
| E-learning control | Connectivity/participation evidence for distance learning. Meeting URLs and timestamps are not equivalent to official control. | Requires functional validation |
| Attendance | SkillFlow record with status, method, check-in/out, and optional location/evidence fields. It is not official LCE attendance. | Product |
| Sworn statement | Declaration by an authorized party or participant under the applicable process. Not implemented. | Requires functional validation |
| Tax franchise | Chilean training tax-incentive context. SkillFlow stores some amounts but has no eligibility or calculation engine. | Requires functional validation |
| Certificate | SkillFlow-issued record with number, verification code, status, dates, and public validation. Current document rendering is a stub. | Product |
| Observation | Local declaration state indicating an issue requiring review. It is not synchronized with an official system. | Product |
| Rejection | Local state or transition indicating a record/action was rejected. Reason semantics depend on the workflow. | Product |
| External folio | Identifier returned or assigned by an external process. SkillFlow may store an external reference but does not currently obtain one online. | Product proposal |
| Readiness | Internal, date-effective evaluation of configured antecedents. It is not official compliance or accreditation. | Product proposal |
| Blocking issue | Failed applicable rule that forces readiness to `NOT_READY` regardless of score. | Product proposal |
| Warning | Non-blocking applicable condition, commonly an upcoming expiration or unvalidated optional antecedent. | Product proposal |
| Effective date | Date at which a record or rule begins/ends applicability for an evaluation. | Product proposal |
| Module entitlement | Tenant-scoped availability state for a commercial/functional module, separate from domain readiness and billing. | Product proposal |

## Prohibited Equivalences

- Internal `READY` ≠ accredited by SENCE.
- Stored RUDO reference ≠ validated in RUDO.
- Stored SENCE code ≠ current official course authorization.
- Document identifier ≠ verified authentic evidence.
- Attendance record ≠ LCE attendance certificate.
- Local `SUBMITTED` ≠ received by SENCE or OTIC.
- Public certificate verification ≠ SENCE certificate validation.

