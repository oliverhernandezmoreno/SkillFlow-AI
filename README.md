# SkillFlow AI

SkillFlow AI is a B2B HRTech platform for training management, annual training plans, employee records, course catalog management, compliance workflows, and future AI-assisted HR operations.

## Stack

- Node.js 20+
- TypeScript strict mode
- Express.js
- Prisma ORM
- PostgreSQL
- Vitest and Supertest
- ESLint and Prettier
- Next.js frontend with TanStack Query, React Hook Form, Zod, Recharts, and Vitest

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
- `/api/v1/training-sessions/*`
- `/api/v1/enrollments/*`
- `/api/v1/attendance/*`
- `/api/v1/evaluations/*`
- `/api/v1/certificates/*`
- `/api/v1/sence/declarations/*`

See `docs/openapi-implementation-report.md` for the current OpenAPI implementation inventory.

## Commercial Demo Backend Flow

The backend includes a real PostgreSQL E2E flow for the v1.0 commercial demo:

```text
Organization -> User -> Employee -> Course -> Training Plan -> Training Session
-> Enrollment -> Attendance -> Evaluation -> Certificate -> SENCE Declaration
```

Seed demo data with:

```bash
npm run seed:demo
```

The seed uses `DATABASE_URL_DEMO`, then `DATABASE_URL`, then the local default `postgresql://postgres:postgres@localhost:5433/skillflow?schema=public`.

Demo credentials are non-production sample credentials:

```text
Email: admin@skillflow.demo
Password: DemoPassword123
```

See `docs/demo-script.md` and `docs/rbac-matrix.md` for the demo walkthrough and permission matrix.

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

Start the backend API:

```bash
npm install
docker compose up -d
npm run prisma:generate
npm run prisma:validate
npm run seed:demo
npm run dev
```

The API runs on `http://localhost:3000` by default.

Start the frontend in a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:3001` when started with `npm run dev -- --port 3001`. It reads the API URL from `NEXT_PUBLIC_API_URL`, with `http://localhost:3000/api/v1` as the demo default.

Password recovery screens are available at `/forgot-password` and `/reset-password` and use the backend password reset endpoints when enabled by environment configuration.

The v1.5 frontend demo experience includes a demo banner, guided checklist, persistent module filters, toast notifications, connected create/edit forms for priority operational resources, and basic frontend regression tests.

## Deployment Demo

Recommended public demo architecture:

```text
Vercel Frontend
↓
Render Backend
↓
Supabase PostgreSQL
```

Backend local commands:

```bash
npm install
npm run build
npm run dev
```

Frontend local commands:

```bash
cd frontend
npm install
npm run dev -- --port 3001
```

Production backend commands:

```bash
npm run build
npm run start
npm run prisma:migrate:deploy
npm run seed:demo
```

Render backend settings:

- Build command: `npm ci && npm run prisma:generate && npm run build`
- Start command: `npm run start`
- Health check path: `/health`
- Required secrets: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`

Vercel frontend settings:

- Root directory: `frontend`
- Build command: `npm run build`
- Environment variable: `NEXT_PUBLIC_API_URL=https://tu-backend-render.onrender.com/api/v1`

Deployment guides:

- `docs/deployment-backend.md`
- `docs/deployment-frontend.md`

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
npm run test:e2e
npx prisma validate
```

Frontend quality gate:

```bash
cd frontend
npm run lint
npm run build
npm test
```

`npm run test:e2e` requires a safe PostgreSQL database. It resolves `DATABASE_URL_TEST`, then `DATABASE_URL`, then the local default `postgresql://postgres:postgres@localhost:5433/skillflow?schema=public`, applies Prisma migrations, and runs the HTTP + DB assertions. Do not point this command at production data.

The CI workflow in `.github/workflows/backend-ci.yml` runs the same backend gate on pushes and pull requests with a PostgreSQL service.

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
