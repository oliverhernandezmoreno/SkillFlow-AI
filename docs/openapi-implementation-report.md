# OpenAPI Implementation Report

This report compares `docs/api-spec.yml` with the current Express implementation.

## Implemented Endpoints

These endpoints are registered by the application today.

| Method | Path | Protected |
|---|---|---|
| GET | `/health` | No |
| GET | `/api/v1/health` | No |
| POST | `/api/v1/auth/register` | No |
| POST | `/api/v1/auth/login` | No |
| GET | `/api/v1/auth/me` | Yes |
| POST | `/api/v1/auth/refresh` | No |
| POST | `/api/v1/auth/logout` | Yes |
| GET | `/api/v1/organizations` | Yes |
| POST | `/api/v1/organizations` | Yes |
| GET | `/api/v1/organizations/{organizationId}` | Yes |
| PUT | `/api/v1/organizations/{organizationId}` | Yes |
| PATCH | `/api/v1/organizations/{organizationId}` | Yes |
| DELETE | `/api/v1/organizations/{organizationId}` | Yes |
| GET | `/api/v1/users` | Yes |
| POST | `/api/v1/users` | Yes |
| GET | `/api/v1/users/{userId}` | Yes |
| PUT | `/api/v1/users/{userId}` | Yes |
| PATCH | `/api/v1/users/{userId}` | Yes |
| DELETE | `/api/v1/users/{userId}` | Yes |
| GET | `/api/v1/employees` | Yes |
| POST | `/api/v1/employees` | Yes |
| GET | `/api/v1/employees/{employeeId}` | Yes |
| PATCH | `/api/v1/employees/{employeeId}` | Yes |
| GET | `/api/v1/courses` | Yes |
| POST | `/api/v1/courses` | Yes |
| GET | `/api/v1/courses/{courseId}` | Yes |
| PATCH | `/api/v1/courses/{courseId}` | Yes |
| DELETE | `/api/v1/courses/{courseId}` | Yes |
| GET | `/api/v1/training-plans` | Yes |
| POST | `/api/v1/training-plans` | Yes |
| GET | `/api/v1/training-plans/{trainingPlanId}` | Yes |
| PATCH | `/api/v1/training-plans/{trainingPlanId}` | Yes |
| POST | `/api/v1/training-plans/{trainingPlanId}/approve` | Yes |
| POST | `/api/v1/training-plans/{trainingPlanId}/reject` | Yes |
| POST | `/api/v1/training-plans/{trainingPlanId}/items` | Yes |
| GET | `/api/v1/instructors` | Yes |
| POST | `/api/v1/instructors` | Yes |
| GET | `/api/v1/instructors/{instructorId}` | Yes |
| PATCH | `/api/v1/instructors/{instructorId}` | Yes |
| GET | `/api/v1/training-sessions` | Yes |
| POST | `/api/v1/training-sessions` | Yes |
| GET | `/api/v1/training-sessions/{trainingSessionId}` | Yes |
| PATCH | `/api/v1/training-sessions/{trainingSessionId}` | Yes |
| POST | `/api/v1/training-sessions/{trainingSessionId}/publish` | Yes |
| GET | `/api/v1/enrollments` | Yes |
| POST | `/api/v1/enrollments` | Yes |
| GET | `/api/v1/enrollments/{enrollmentId}` | Yes |
| PUT | `/api/v1/enrollments/{enrollmentId}` | Yes |
| POST | `/api/v1/enrollments/{enrollmentId}/confirm` | Yes |
| POST | `/api/v1/enrollments/{enrollmentId}/reject` | Yes |
| POST | `/api/v1/enrollments/{enrollmentId}/cancel` | Yes |
| POST | `/api/v1/enrollments/{enrollmentId}/complete` | Yes |
| GET | `/api/v1/training-sessions/{trainingSessionId}/enrollments` | Yes |
| GET | `/api/v1/employees/{employeeId}/enrollments` | Yes |
| GET | `/api/v1/attendance` | Yes |
| POST | `/api/v1/attendance` | Yes |
| GET | `/api/v1/attendance/{attendanceId}` | Yes |
| PUT | `/api/v1/attendance/{attendanceId}` | Yes |
| POST | `/api/v1/attendance/bulk` | Yes |
| POST | `/api/v1/attendance/{attendanceId}/check-in` | Yes |
| POST | `/api/v1/attendance/{attendanceId}/check-out` | Yes |
| GET | `/api/v1/training-sessions/{trainingSessionId}/attendance` | Yes |
| GET | `/api/v1/employees/{employeeId}/attendance` | Yes |
| GET | `/api/v1/attendance/{attendanceId}/metrics` | Yes |
| GET | `/api/v1/evaluations` | Yes |
| POST | `/api/v1/evaluations` | Yes |
| GET | `/api/v1/evaluations/{evaluationId}` | Yes |
| PUT | `/api/v1/evaluations/{evaluationId}` | Yes |
| POST | `/api/v1/evaluations/{evaluationId}/questions` | Yes |
| PUT | `/api/v1/evaluations/{evaluationId}/questions/{questionId}` | Yes |
| POST | `/api/v1/evaluations/{evaluationId}/submit` | Yes |
| POST | `/api/v1/evaluations/{evaluationId}/answers` | Yes |
| POST | `/api/v1/evaluations/{evaluationId}/close` | Yes |
| GET | `/api/v1/training-sessions/{trainingSessionId}/evaluations` | Yes |
| GET | `/api/v1/employees/{employeeId}/evaluations` | Yes |
| GET | `/api/v1/enrollments/{enrollmentId}/evaluations` | Yes |
| GET | `/api/v1/evaluations/{evaluationId}/result` | Yes |

## Phase 7 Documentation Status

- Instructors: implemented and documented.
- Training Sessions: implemented and documented.
- Enrollments: implemented and documented.

### Phase 7 Endpoints Added To OpenAPI

- `GET /api/v1/instructors`
- `POST /api/v1/instructors`
- `GET /api/v1/instructors/{instructorId}`
- `PATCH /api/v1/instructors/{instructorId}`
- `GET /api/v1/training-sessions`
- `POST /api/v1/training-sessions`
- `GET /api/v1/training-sessions/{trainingSessionId}`
- `PATCH /api/v1/training-sessions/{trainingSessionId}`
- `POST /api/v1/training-sessions/{trainingSessionId}/publish`
- `GET /api/v1/enrollments`
- `POST /api/v1/enrollments`
- `GET /api/v1/enrollments/{enrollmentId}`
- `PUT /api/v1/enrollments/{enrollmentId}`
- `POST /api/v1/enrollments/{enrollmentId}/confirm`
- `POST /api/v1/enrollments/{enrollmentId}/reject`
- `POST /api/v1/enrollments/{enrollmentId}/cancel`
- `POST /api/v1/enrollments/{enrollmentId}/complete`
- `GET /api/v1/training-sessions/{trainingSessionId}/enrollments`
- `GET /api/v1/employees/{employeeId}/enrollments`

## Phase 9 Documentation Status

- Attendance: implemented and documented.

### Phase 9 Endpoints Added To OpenAPI

- `GET /api/v1/attendance`
- `GET /api/v1/attendance/{attendanceId}`
- `POST /api/v1/attendance`
- `PUT /api/v1/attendance/{attendanceId}`
- `POST /api/v1/attendance/bulk`
- `POST /api/v1/attendance/{attendanceId}/check-in`
- `POST /api/v1/attendance/{attendanceId}/check-out`
- `GET /api/v1/training-sessions/{trainingSessionId}/attendance`
- `GET /api/v1/employees/{employeeId}/attendance`
- `GET /api/v1/attendance/{attendanceId}/metrics`

## Phase 10 Documentation Status

- Evaluations: implemented and documented.

### Phase 10 Endpoints Added To OpenAPI

- `GET /api/v1/evaluations`
- `GET /api/v1/evaluations/{evaluationId}`
- `POST /api/v1/evaluations`
- `PUT /api/v1/evaluations/{evaluationId}`
- `POST /api/v1/evaluations/{evaluationId}/questions`
- `PUT /api/v1/evaluations/{evaluationId}/questions/{questionId}`
- `POST /api/v1/evaluations/{evaluationId}/submit`
- `POST /api/v1/evaluations/{evaluationId}/answers`
- `POST /api/v1/evaluations/{evaluationId}/close`
- `GET /api/v1/training-sessions/{trainingSessionId}/evaluations`
- `GET /api/v1/employees/{employeeId}/evaluations`
- `GET /api/v1/enrollments/{enrollmentId}/evaluations`
- `GET /api/v1/evaluations/{evaluationId}/result`

## Phase 11 Documentation Status

- Certificates: implemented and documented.

### Phase 11 Endpoints Added To OpenAPI

- `GET /api/v1/certificates`
- `GET /api/v1/certificates/{certificateId}`
- `POST /api/v1/certificates/eligibility`
- `POST /api/v1/certificates`
- `POST /api/v1/certificates/{certificateId}/revoke`
- `GET /api/v1/employees/{employeeId}/certificates`
- `GET /api/v1/enrollments/{enrollmentId}/certificates`
- `POST /api/v1/certificates/{certificateId}/document`
- `GET /api/v1/certificates/verify/{verificationCode}`

## Known Technical Risks - Certificates

1. Certificate Number Concurrency

   The `certificateNumber` generation can have a race condition under concurrent issuance. The current global unique index protects against duplicate persisted certificate numbers, but a future phase must implement transactional sequence serialization per organization and year.

2. Course Certificate Rules

   `Course` does not persist `attendanceThreshold` or `requiresEvaluation` fields. Certificates currently use `CERTIFICATE_MIN_ATTENDANCE_PERCENTAGE=75` and a conservative rule based on existing evaluations for the training session.

3. Document Status

   `Document` does not persist a status field. The `GENERATED` status returned by the certificate document stub is derived in the DTO. A future phase should add persistent states for generated, pending, failed, and revoked documents.

## Documented But Not Implemented

These paths exist in `docs/api-spec.yml` but do not have Express routes yet.

- `GET /api/v1/roles`
- `GET /api/v1/sence/declarations`
- `POST /api/v1/sence/declarations`
- `POST /api/v1/sence/declarations/{senceDeclarationId}/submit`
- `GET /api/v1/providers`
- `POST /api/v1/providers`
- `POST /api/v1/documents`
- `GET /api/v1/reports/dashboard`
- `GET /api/v1/reports/training-compliance`
- `POST /api/v1/ai/recommendations/training-gaps`
- `GET /api/v1/audit/events`

## Implemented But Not Documented

These Express routes are not represented in `docs/api-spec.yml`.

- `POST /api/v1/auth/logout`
- `PUT /api/v1/organizations/{organizationId}`
- `PUT /api/v1/users/{userId}`
- `POST /api/v1/training-plans/{trainingPlanId}/approve`
- `POST /api/v1/training-plans/{trainingPlanId}/reject`

## Roadmap Endpoints Still Pending

- `GET /api/v1/roles`
- `GET /api/v1/sence/declarations`
- `POST /api/v1/sence/declarations`
- `POST /api/v1/sence/declarations/{senceDeclarationId}/submit`
- `GET /api/v1/providers`
- `POST /api/v1/providers`
- `POST /api/v1/documents`
- `GET /api/v1/reports/dashboard`
- `GET /api/v1/reports/training-compliance`
- `POST /api/v1/ai/recommendations/training-gaps`
- `GET /api/v1/audit/events`

## Notes

- The OpenAPI production server URL contains a space and should be corrected before publication.
- The OpenAPI contract intentionally includes future modules. Keep this report updated until those modules are implemented or the public contract is narrowed.
