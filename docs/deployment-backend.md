# Backend Deployment

This guide prepares the SkillFlow AI backend for a public demo on Render with Supabase PostgreSQL or Render PostgreSQL.

## Target Architecture

```text
Vercel Frontend
  -> Render Backend
    -> Supabase PostgreSQL
```

## Required Environment Variables

Set these variables in Render. Do not commit real values.

```env
NODE_ENV=production
PORT=3000
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/postgres?schema=public"
JWT_SECRET="generate-a-strong-secret-at-least-32-characters"
JWT_REFRESH_SECRET="generate-another-strong-secret-at-least-32-characters"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
ALLOWED_ORIGINS="http://localhost:3001,https://skillflow-ai.vercel.app"
JSON_PAYLOAD_LIMIT="1mb"
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=300
```

Production startup fails fast when `DATABASE_URL`, `JWT_SECRET`, or `JWT_REFRESH_SECRET` is missing.

## Supabase PostgreSQL

1. Create a Supabase project.
2. Open Project Settings -> Database.
3. Copy the PostgreSQL connection string.
4. Replace user, password, host, and database values.
5. Keep `?schema=public` in the URL.

Example format:

```text
postgresql://USER:PASSWORD@HOST:5432/postgres?schema=public
```

Use the pooled or direct connection string according to the deployment plan. For Prisma migrations, the direct connection string is the safest default.

## Render Service

Render can use the checked-in `render.yaml` or a manual web service.

Manual settings:

- Environment: Node
- Build command: `npm ci && npm run prisma:generate && npm run build`
- Start command: `npm run start`
- Health check path: `/health`
- Root directory: repository root

The production start command runs:

```bash
node dist/main.js
```

## Docker

A backend `Dockerfile` is available for container-based deployment.

```bash
docker build -t skillflow-ai-backend .
docker run --env-file .env -p 3000:3000 skillflow-ai-backend
```

## Prisma Production Steps

Run these against the production database after setting `DATABASE_URL`:

```bash
npm run prisma:generate
npm run prisma:migrate:deploy
npm run seed:demo
```

For Render, run `npm run prisma:migrate:deploy` and `npm run seed:demo` from a one-off shell or job after the service environment variables are configured.

## Health Validation

Validate both health endpoints:

```bash
curl https://TU-BACKEND-RENDER.onrender.com/health
curl https://TU-BACKEND-RENDER.onrender.com/api/v1/health
```

Expected response includes:

```json
{
  "status": "ok"
}
```

## Demo Credentials

The demo seed creates a non-production operator:

```text
Email: admin@skillflow.demo
Password: DemoPassword123
```

The seed also creates demo RBAC permissions, organization, employee, course, training session, enrollment, attendance, evaluation, certificate, and SENCE declaration records.

## Security Notes

- Keep `.env` and real secrets out of git.
- Use strong JWT secrets in production.
- Keep `ALLOWED_ORIGINS` restricted to the local frontend, the Vercel app, and future custom domains.
- Do not use wildcard CORS in production.
- Rotate the demo password before any non-demo environment.
