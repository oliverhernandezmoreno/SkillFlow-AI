# Commercial Demo Script

This script describes the commercial demo with the backend API and the v1.5 polished frontend. It intentionally avoids real SENCE integration and AI features.

## Setup

1. Start a local PostgreSQL database.

   ```bash
   docker compose up -d
   ```

   If the machine only has classic Compose, use:

   ```bash
   docker-compose up -d
   ```

2. Apply migrations and seed demo data.

   ```bash
   npm run seed:demo
   ```

   `seed:demo` uses `DATABASE_URL_DEMO`, then `DATABASE_URL`, then the local default `postgresql://postgres:postgres@localhost:5433/skillflow?schema=public`.

3. Run the backend.

   ```bash
   npm run dev
   ```

4. Run the frontend in a separate terminal.

   ```bash
   cd frontend
   npm run dev -- --port 3001
   ```

   The frontend uses `NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1` for the local demo.
   Protected screens show the demo banner, backend connection status, and guided checklist.

## Demo Account

Use the seeded non-production demo account:

```text
Email: admin@skillflow.demo
Password: DemoPassword123
```

The login screen includes a demo helper that fills these credentials.

## Demo Flow

1. Show the health endpoint at `GET /health`.
2. Sign in to the frontend at `http://localhost:3001/login`.
3. Open the dashboard and show KPIs derived from backend data, quick actions, loading/error states, and the demo checklist.
4. Open Employees, search/filter the live list, and create or edit a participant profile.
5. Open Courses, search/filter the catalog, and create or edit a course.
6. Open Training Sessions, filter by status, schedule or edit a session, and publish a scheduled session.
7. Open Enrollments, enroll an employee into a session, and cancel an enrollment when needed.
8. Open Attendance and record bulk manual attendance for the first session with enrollments.
9. Open Evaluations and create a knowledge check for an available session.
10. Open Certificates and issue a certificate from an eligible enrollment.
11. Open SENCE and create, validate, mark ready, and submit a declaration through the visual workflow.

## Verification

Run the real-database E2E command against a safe non-production database:

```bash
DATABASE_URL_TEST="postgresql://postgres:postgres@localhost:5433/skillflow?schema=public" npm run test:e2e
```

The E2E test applies Prisma migrations before running and refuses non-local databases unless `DATABASE_URL_TEST` is explicitly set.

Run the frontend quality gate:

```bash
cd frontend
npm run lint
npm run build
npm test
```

## Boundaries

- Demo data reset is disabled in the UI until a reset endpoint or script is exposed for the frontend.
- Dashboard analytics are derived from module list endpoints; dedicated aggregate analytics endpoints remain a future optimization.
- SENCE remains a stubbed compliance workflow; it does not call external SENCE services.
- AI recommendations are roadmap and are not implemented.
- Demo data is not production data and must not be pointed at a production database.
