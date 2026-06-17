# SkillFlow AI Frontend

Next.js frontend for the SkillFlow AI commercial demo. The app is connected to the backend through the OpenAPI-aligned REST surface and is optimized for the demo flow across HR operations, training, compliance, certificates, and SENCE.

## Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui-style primitives
- TanStack Query
- Zustand
- React Hook Form
- Zod
- Recharts
- TanStack Table
- Lucide React
- Framer Motion
- Vitest and React Testing Library

## Local Development

Install dependencies and run the app:

```bash
npm install
npm run dev -- --port 3001
```

The frontend uses `NEXT_PUBLIC_API_URL` for the backend API. The local demo default is:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_SUPABASE_URL=https://mlxjqxuwvlrvzurnogko.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_umzl9w1L4mOhyPv6olgpHw_nTdfs_yP
```

Supabase is configured only with public frontend helpers for this phase. SkillFlow AI authentication still uses the backend JWT/Auth/RBAC flow through Zustand and the backend API. Supabase Auth is not active and must not replace the current login flow.

Start the backend from the repository root before running the demo:

```bash
docker compose up -d
npm run seed:demo
npm run dev
```

## Demo Account

```text
Email: admin@skillflow.demo
Password: DemoPassword123
```

The login screen can fill the demo credentials automatically. Protected pages include a demo banner, backend connection status, and a guided checklist for the commercial flow.

## Demo Flow

```text
Login -> Dashboard -> Employees -> Courses -> Training Sessions -> Enrollments
-> Attendance -> Evaluations -> Certificates -> SENCE
```

## Quality Commands

```bash
npm run lint
npm run build
npm test
npm run test:watch
```

## Current Boundaries

- Dashboard metrics are derived from existing module endpoints; dedicated analytics endpoints are a future optimization.
- Demo data reset is shown as disabled because no reset endpoint is available.
- Supabase Auth is not active; Supabase is used as managed PostgreSQL and optional public frontend helpers only.
- SENCE remains a backend-stubbed compliance workflow and does not call external SENCE services.
- Certificate verification UI shows certificate records; public verification expansion remains available through backend contracts.
