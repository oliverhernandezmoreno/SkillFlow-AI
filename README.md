# SkillFlow AI Backend

Backend base for SkillFlow AI, built with Node.js, TypeScript strict mode, Express.js, Prisma, and PostgreSQL.

## Stack

- Node.js 20+
- TypeScript strict
- Express.js
- Prisma ORM
- PostgreSQL
- Vitest and Supertest
- ESLint and Prettier

## Architecture

The source code follows Clean Architecture with DDD-oriented boundaries:

```text
src/
├── domain/
├── application/
├── infrastructure/
└── interfaces/
```

Current implemented HTTP surface:

- `GET /health`
- `GET /api/v1/health`

## Setup

```bash
npm install
cp .env.example .env
npm run prisma:generate
```

## Commands

```bash
npm run dev
npm run build
npm start
npm test
npm run lint
npm run format
npm run format:check
npm run prisma:generate
npm run prisma:validate
```

## Environment

Required variables are documented in `.env.example`.

```env
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/skillflow_ai?schema=public"
```

## Health Check

When the server is running:

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2026-06-13T00:00:00.000Z"
}
```
