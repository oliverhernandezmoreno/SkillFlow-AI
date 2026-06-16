# RBAC Matrix

This backend uses JWT permissions checked by `requirePermission`. The commercial demo assumes an administrative operator with the permissions below.

| Area | Permission | Current HTTP coverage |
|---|---|---|
| Organizations | `organizations.read` | List and read organizations |
| Organizations | `organizations.update` | Create, update, replace, and deactivate organizations |
| Users | `users.read` | List and read users |
| Users | `users.create` | Create users |
| Users | `users.update` | Update, replace, and deactivate users |
| Employees | `employees.read` | List and read employees |
| Employees | `employees.create` | Create employees |
| Employees | `employees.update` | Update employees |
| Courses | `courses.read` | List and read courses |
| Courses | `courses.create` | Create courses |
| Courses | `courses.update` | Update and archive courses |
| Training plans | `training_plan.read` | List and read annual plans |
| Training plans | `training_plan.create` | Create annual plans |
| Training plans | `training_plan.update` | Update plans and add plan items |
| Training plans | `training_plan.approve` | Approve and reject plans |
| Training sessions | `training_sessions.read` | List and read sessions |
| Training sessions | `training_sessions.create` | Create sessions |
| Training sessions | `training_sessions.update` | Update sessions |
| Training sessions | `training_sessions.publish` | Publish sessions |
| Enrollments | `enrollments.read` | List, read, and nested enrollment views |
| Enrollments | `enrollments.create` | Create enrollments |
| Enrollments | `enrollments.update` | Update enrollments |
| Enrollments | `enrollments.confirm` | Confirm enrollments |
| Enrollments | `enrollments.reject` | Reject enrollments |
| Enrollments | `enrollments.cancel` | Cancel enrollments |
| Enrollments | `enrollments.complete` | Complete enrollments |
| Attendance | `attendance.read` | List, read, and nested attendance views |
| Attendance | `attendance.create` | Create attendance records |
| Attendance | `attendance.bulk` | Create attendance records in bulk |
| Attendance | `attendance.update` | Update attendance and check-in/check-out |
| Attendance | `attendance.checkin` | Check in attendance records |
| Attendance | `attendance.checkout` | Check out attendance records |
| Attendance | `attendance.metrics` | Read attendance metrics |
| Evaluations | `evaluations.read` | List, read, and nested evaluation views |
| Evaluations | `evaluations.create` | Create evaluations |
| Evaluations | `evaluations.update` | Update evaluations and questions |
| Evaluations | `evaluations.submit` | Submit evaluations and individual answers |
| Evaluations | `evaluations.close` | Close evaluations |
| Evaluations | `evaluations.result` | Read evaluation results |
| Certificates | `certificates.read` | List, read, verify, and nested certificate views |
| Certificates | `certificates.issue` | Check eligibility and issue certificates |
| Certificates | `certificates.revoke` | Revoke certificates |
| Certificates | `certificates.document` | Generate certificate document metadata |
| SENCE | `sence.read` | List, read, and session declaration lookup |
| SENCE | `sence.create` | Create SENCE declarations |
| SENCE | `sence.update` | Update SENCE declarations |
| SENCE | `sence.validate` | Validate declaration readiness |
| SENCE | `sence.evidence` | Build evidence summary |
| SENCE | `sence.ready` | Mark declarations ready |
| SENCE | `sence.submit` | Mark declarations submitted through the stub flow |
| SENCE | `sence.status` | Update external status through the stub flow |
| SENCE | `sence.documents` | Attach and list SENCE documents |

## Demo Operator

The E2E commercial demo mints a test-only JWT with the permissions required to traverse the implemented backend flow. It does not create a production role or bypass endpoint authorization.

## Roadmap Areas

The OpenAPI contract still marks roles, providers, documents, reports, AI recommendations, and audit listing as roadmap where no Express route exists yet.
