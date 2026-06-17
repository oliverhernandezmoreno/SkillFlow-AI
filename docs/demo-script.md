# Commercial Demo Script

This script describes the v1.0 commercial demo with the backend API and the frontend foundation. It intentionally avoids real SENCE integration, real email delivery, and AI features.

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
3. Open the dashboard and show KPIs derived from backend data.
4. Show the HR admin user and participant employee.
5. Show the course catalog entry for `Operational Safety Essentials`.
6. Show the 2026 annual training plan and its planned course item.
7. Show the scheduled training session linked to the plan item.
8. Show the participant enrollment and completed attendance.
9. Show the closed knowledge evaluation and passed response.
10. Show the issued certificate and verification code.
11. Show the SENCE declaration created from the training session.

## Verification

Run the real-database E2E command against a safe non-production database:

```bash
DATABASE_URL_TEST="postgresql://postgres:postgres@localhost:5433/skillflow?schema=public" npm run test:e2e
```

The E2E test applies Prisma migrations before running and refuses non-local databases unless `DATABASE_URL_TEST` is explicitly set.

## Boundaries

- Frontend password recovery is currently a stub controlled by `NEXT_PUBLIC_ENABLE_PASSWORD_RESET=false`.
- No real recovery email is sent.
- No real reset token is issued until backend password reset endpoints exist.
- SENCE remains a stubbed compliance workflow; it does not call external SENCE services.
- AI recommendations are roadmap and are not implemented.
- Demo data is not production data and must not be pointed at a production database.
