# SkillFlow AI Backend

SkillFlow AI is a B2B HRTech backend for training management, annual training plans, employee records, course catalog management, compliance workflows, and future AI-assisted HR operations.

## Stack

- Node.js 20+
- TypeScript strict mode
- Express.js
- Prisma ORM
- PostgreSQL
- Vitest and Supertest
- ESLint and Prettier

## Architecture

The backend follows modular Clean Architecture with tactical DDD boundaries.

```text
src/
├── config/
├── domain/
├── application/
├── infrastructure/
├── interfaces/
└── modules/
    ├── auth/
    ├── organizations/
    ├── users/
    ├── employees/
    ├── courses/
    └── training-plans/
```

Each business module separates domain entities, application use cases, Prisma repositories, HTTP controllers, routes, and validators.

## Implemented HTTP Surface

- `GET /health`
- `GET /api/v1/health`
- `/api/v1/auth/*`
- `/api/v1/organizations/*`
- `/api/v1/users/*`
- `/api/v1/employees/*`
- `/api/v1/courses/*`
- `/api/v1/training-plans/*`

See `docs/openapi-implementation-report.md` for the current OpenAPI implementation inventory.

## Environment

Copy the example file and adjust values:

```bash
cp .env.example .env
```

Required production variables:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL="postgresql://user:password@host:5432/skillflow?schema=public"
JWT_SECRET="at-least-32-characters"
JWT_REFRESH_SECRET="at-least-32-characters"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
ALLOWED_ORIGINS="https://app.example.com"
JSON_PAYLOAD_LIMIT="1mb"
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=300
```

Production startup fails if `DATABASE_URL`, `JWT_SECRET`, or `JWT_REFRESH_SECRET` is missing.

## Local Development

```bash
npm install
docker compose up -d
npm run prisma:generate
npm run prisma:validate
npm run dev
```

The API runs on `http://localhost:3000` by default.

## Prisma

The canonical schema is `prisma/schema.prisma`.

Useful commands:

```bash
npm run prisma:generate
npm run prisma:validate
npx prisma migrate dev
```

## Tests And Quality

```bash
npm run build
npm run lint
npm test
npx prisma validate
```

The CI workflow in `.github/workflows/backend-ci.yml` runs the same backend gate on pushes and pull requests.

## Known Technical Risks - Certificates

1. Certificate Number Concurrency

   The `certificateNumber` generation can have a race condition under concurrent issuance. The current global unique index protects against duplicate persisted certificate numbers, but a future phase must implement transactional sequence serialization per organization and year.

2. Course Certificate Rules

   `Course` does not persist `attendanceThreshold` or `requiresEvaluation` fields. Certificates currently use `CERTIFICATE_MIN_ATTENDANCE_PERCENTAGE=75` and a conservative rule based on existing evaluations for the training session.

3. Document Status

   `Document` does not persist a status field. The `GENERATED` status returned by the certificate document stub is derived in the DTO. A future phase should add persistent states for generated, pending, failed, and revoked documents.

## Docker

`docker-compose.yml` starts PostgreSQL for local development:

```bash
docker compose up -d
docker compose ps
```

The database is exposed on `localhost:5433` and uses the credentials from `.env.example`.
