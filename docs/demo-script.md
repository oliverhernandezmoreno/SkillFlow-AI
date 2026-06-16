# Commercial Demo Script

This script describes the backend-only v1.0 commercial demo. It intentionally avoids frontend, real SENCE integration, and AI features.

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

## Demo Flow

1. Show the health endpoint at `GET /health`.
2. Create or inspect the demo organization.
3. Show the HR admin user and participant employee.
4. Show the course catalog entry for `Operational Safety Essentials`.
5. Show the 2026 annual training plan and its planned course item.
6. Show the scheduled training session linked to the plan item.
7. Show the participant enrollment and completed attendance.
8. Show the closed knowledge evaluation and passed response.
9. Show the issued certificate and verification code.
10. Show the SENCE declaration created from the training session.

## Verification

Run the real-database E2E command against a safe non-production database:

```bash
DATABASE_URL_TEST="postgresql://postgres:postgres@localhost:5433/skillflow?schema=public" npm run test:e2e
```

The E2E test applies Prisma migrations before running and refuses non-local databases unless `DATABASE_URL_TEST` is explicitly set.

## Boundaries

- No frontend is included in this demo.
- SENCE remains a stubbed compliance workflow; it does not call external SENCE services.
- AI recommendations are roadmap and are not implemented.
- Demo data is not production data and must not be pointed at a production database.
