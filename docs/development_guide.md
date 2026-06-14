# SkillFlow AI Development Guide

This guide explains how to run, test, and validate the SkillFlow AI backend locally.

## Prerequisites

- Node.js 20 or newer
- npm
- Docker and Docker Compose
- Git

## Setup

```bash
npm install
cp .env.example .env
docker compose up -d
npm run prisma:generate
npm run prisma:validate
```

## Run The API

```bash
npm run dev
```

Default base URLs:

- Root health check: `http://localhost:3000/health`
- Versioned API: `http://localhost:3000/api/v1`
- Versioned health check: `http://localhost:3000/api/v1/health`

## Environment Variables

Development may use safe local defaults for missing secrets. Production must explicitly provide:

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`

Other supported variables:

- `PORT`
- `JWT_ACCESS_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`
- `ALLOWED_ORIGINS`
- `JSON_PAYLOAD_LIMIT`
- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_MAX_REQUESTS`

## Database

Local PostgreSQL is defined in `docker-compose.yml`.

```bash
docker compose up -d
docker compose ps
```

The development database URL from `.env.example` uses port `5433`.

## Prisma

```bash
npm run prisma:generate
npm run prisma:validate
npx prisma migrate dev
```

Use `prisma/schema.prisma` as the canonical schema. The `backend/prisma/schema.prisma` path is a symlink for compatibility.

## Quality Gate

Run the full local backend gate before opening a pull request:

```bash
npm run build
npm run lint
npm test
npx prisma validate
```

The GitHub Actions workflow `.github/workflows/backend-ci.yml` runs the same checks.

## Security Expectations

- Protected business endpoints must use JWT authentication.
- Protected business endpoints must use RBAC permission checks.
- Tenant-owned repositories must query and update records with `organizationId`.
- Controllers must derive tenant context from the authenticated token.
- Production errors must not expose stack traces, Prisma messages, or internal exception details.
- CORS must be configured through `ALLOWED_ORIGINS`.

## Current Modules

Implemented:

- Auth
- Organizations
- Users
- Employees
- Courses
- Training Plans

Not implemented yet:

- Training Sessions
- Enrollments
- Attendance
- Evaluations
- Certificates
- SENCE
- Providers
- Documents
- Reports
- AI Copilot

See `docs/openapi-implementation-report.md` for the current API inventory.
