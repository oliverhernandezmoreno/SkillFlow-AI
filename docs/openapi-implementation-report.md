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

## Documented But Not Implemented

These paths exist in `docs/api-spec.yml` but do not have Express routes yet.

- `GET /api/v1/roles`
- `GET /api/v1/training-sessions`
- `POST /api/v1/training-sessions`
- `GET /api/v1/training-sessions/{trainingSessionId}`
- `PATCH /api/v1/training-sessions/{trainingSessionId}`
- `POST /api/v1/training-sessions/{trainingSessionId}/publish`
- `GET /api/v1/enrollments`
- `POST /api/v1/enrollments`
- `PATCH /api/v1/enrollments/{enrollmentId}`
- `POST /api/v1/attendance/check-in`
- `POST /api/v1/attendance/check-out`
- `GET /api/v1/attendance/sessions/{trainingSessionId}`
- `POST /api/v1/evaluations`
- `POST /api/v1/evaluations/{evaluationId}/responses`
- `GET /api/v1/certificates`
- `POST /api/v1/certificates/issue`
- `GET /api/v1/certificates/verify/{verificationCode}`
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

## Notes

- The OpenAPI production server URL contains a space and should be corrected before publication.
- The OpenAPI contract intentionally includes future modules. Keep this report updated until those modules are implemented or the public contract is narrowed.
