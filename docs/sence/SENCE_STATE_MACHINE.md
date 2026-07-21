# Future SENCE Regulatory Activity State Machine

## Scope and Non-Implementation Notice

This is a proposed future state machine for a regulatory training activity. Phase 1 does not implement these activity states. It implements only an OTEC readiness gate that can permit creation of a future `DRAFT` activity.

## Proposed States

| State | Meaning |
|---|---|
| DRAFT | Internal activity record can be edited and has not completed validation. |
| VALIDATION_PENDING | Internal rule evaluation is requested or awaiting required data. |
| NON_COMPLIANT | One or more internal blocking rules failed. This is not an official finding. |
| READY_TO_COMMUNICATE | Internal preparation checks passed and payload review may begin. |
| COMMUNICATED_MANUALLY | An authorized user recorded manual external communication evidence. |
| COMMUNICATED_EXTERNALLY | A future supported connector received a confirmed external response. |
| IN_EXECUTION | Delivery has begun. |
| EXECUTED | Delivery ended and execution evidence is being completed. |
| OBSERVED | An observation was recorded and requires assessment. |
| RECTIFICATION_REQUIRED | A governed correction is required. |
| RECTIFIED | A correction version was prepared/recorded. |
| READY_FOR_PRELIQUIDATION | Internal evidence for pre-liquidation is complete. |
| PRELIQUIDATED | Pre-liquidation outcome was recorded. |
| READY_FOR_LIQUIDATION | Final liquidation package is internally ready. |
| LIQUIDATED | Final liquidation outcome was recorded. |
| REJECTED | Applicable external/internal process rejected the activity. |
| ANNULLED | Authorized annulment was completed/recorded. |
| CLOSED | No further ordinary transitions are permitted. |

## Transition Matrix

| From → To | Authorized actor | Preconditions | Required evidence | Audit action | Idempotency | Future notification/integration |
|---|---|---|---|---|---|---|
| DRAFT → VALIDATION_PENDING | OTEC Operator | Entitled tenant and editable draft | Draft version/snapshot | `activity.validation.requested` | Same version/request key returns prior outcome | Rule evaluation job |
| VALIDATION_PENDING → NON_COMPLIANT | System/Compliance Manager | Blocking internal rule | Rule results | `activity.validation.blocked` | Evaluation ID | Notify owner |
| VALIDATION_PENDING → READY_TO_COMMUNICATE | System/Compliance Manager | All blockers pass | Rule results and dossier checklist | `activity.ready_to_communicate` | Evaluation ID | Payload preparation |
| NON_COMPLIANT → DRAFT | OTEC Operator | Remediation initiated | Change reason | `activity.remediation.started` | Expected version | None |
| READY_TO_COMMUNICATE → COMMUNICATED_MANUALLY | Compliance Manager | Manual receipt/reference supplied | Payload snapshot, actor assertion, external reference | `activity.communication.manual_recorded` | External reference/request key | Manual follow-up |
| READY_TO_COMMUNICATE → COMMUNICATED_EXTERNALLY | Integration service | Supported connector and accepted response | Outbox message, request/response, external folio | `activity.communication.confirmed` | Provider idempotency key | Status synchronization |
| COMMUNICATED_* → IN_EXECUTION | OTEC Operator | Start conditions satisfied | Execution start evidence | `activity.execution.started` | Expected version | Participant/instructor notice |
| IN_EXECUTION → EXECUTED | OTEC Operator | Delivery ended | Class/attendance/evaluation summary | `activity.execution.completed` | Expected version | Dossier completion |
| COMMUNICATED_* or IN_EXECUTION or EXECUTED → OBSERVED | Compliance Manager/Integration | Observation received/recorded | Structured observation and source | `activity.observed` | Observation external ID | Deadline alert |
| OBSERVED → RECTIFICATION_REQUIRED | Compliance Manager | Observation requires change | Decision/reason | `activity.rectification.required` | Expected version | Assignee alert |
| RECTIFICATION_REQUIRED → RECTIFIED | Authorized operator/approver | Corrected immutable version and approval | Before/after payload and approval | `activity.rectified` | Correction version | Manual/external resubmission |
| EXECUTED or RECTIFIED → READY_FOR_PRELIQUIDATION | Compliance Manager | Configured evidence complete | Dossier manifest | `activity.ready_for_preliquidation` | Dossier version | Review queue |
| READY_FOR_PRELIQUIDATION → PRELIQUIDATED | Finance/Integration | Outcome/receipt recorded | Request/response or manual receipt | `activity.preliquidated` | External reference | Outcome notice |
| PRELIQUIDATED → READY_FOR_LIQUIDATION | Finance/Compliance | Final package complete | Financial/evidence manifest | `activity.ready_for_liquidation` | Manifest version | Approval request |
| READY_FOR_LIQUIDATION → LIQUIDATED | Finance/Integration | Accepted final outcome | Receipt and amounts | `activity.liquidated` | External reference | Completion notice |
| Eligible active state → REJECTED | Authorized external recorder/integration | Rejection decision exists | Reason/source/receipt | `activity.rejected` | Decision reference | Remediation/escalation |
| Eligible pre-final state → ANNULLED | Authorized approver/integration | Annulment permitted and reason approved | Approval and receipt | `activity.annulled` | Request/external reference | Participant/finance notice |
| LIQUIDATED, REJECTED, or ANNULLED → CLOSED | Compliance Manager | Retention package complete | Closure checklist | `activity.closed` | Expected version | Archive/retention |

## Invariants

- Official external states cannot be set by a connector unless a supported integration contract exists.
- Manual external-state recording must state its manual source.
- Transitions never overwrite prior communicated payloads or correction versions.
- Every mutation uses tenant scope and expected version.
- Destructive/final transitions require specific permissions and confirmation.
- `NON_COMPLIANT` describes internal rule results only.
- Retries use persisted idempotency keys for external/mutating actions.
- Observations, rectifications, rejection, and annulment preserve reasons and evidence.

## Future Events

Potential integration events include `OtecReadinessChanged`, `ActivityReadyToCommunicate`, `ActivityCommunicationRecorded`, `ActivityExecutionCompleted`, `ActivityObserved`, `ActivityRectificationRequired`, and `ActivityLiquidated`. They require a transactional outbox before production use.

