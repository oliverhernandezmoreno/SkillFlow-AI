# Guion Demo Comercial

This script describes the commercial demo with the backend API and the v2.1 Spanish-first frontend. It intentionally avoids real SENCE integration and AI features.

The demo is oriented to Chile/LatAm customers, OTEC, OTIC, HR teams, and investors.

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
Name: Demo Admin
Visible role: Administrador RRHH
```

The login screen includes a demo helper that fills these credentials.

Seeded organization:

```text
Minera Andes Capacitación
```

Main seeded session:

```text
Seguridad Operacional - Junio 2026
```

## Demo Flow

1. Mostrar el endpoint de salud en `GET /health`.
2. Ingresar al frontend en `http://localhost:3001/login`.
3. Abrir Panel de Control y mostrar KPIs derivados del backend, estados de carga/error y checklist demo.
4. Abrir Colaboradores, buscar/filtrar la lista y crear o editar un perfil.
5. Abrir Cursos, buscar/filtrar el catálogo y crear o editar un curso.
6. Abrir Sesiones, filtrar por estado, programar o editar una sesión y publicar una sesión programada.
7. Abrir Inscripciones, inscribir un colaborador en una sesión y cancelar una inscripción cuando corresponda.
8. Abrir Asistencia y registrar asistencia manual masiva para la primera sesión con inscripciones.
9. Abrir Evaluaciones y crear una evaluación de conocimientos para una sesión disponible.
10. Abrir Certificados y emitir un certificado desde una inscripción elegible.
11. Abrir SENCE y crear, validar, marcar lista y enviar una declaración mediante el flujo visual.

Documented public demo URLs:

- Frontend Vercel: `https://skillflow-ai.vercel.app` when configured in Vercel.
- Backend Render: `https://tu-backend-render.onrender.com` placeholder in deployment docs; replace with the real service URL before presenting externally.

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
