# Frontend Deployment

This guide prepares the SkillFlow AI Next.js frontend for Vercel.

## Vercel Project

1. Import the repository in Vercel.
2. Set Root Directory to `frontend`.
3. Keep Framework Preset as Next.js.
4. Set Build Command to `npm run build`.
5. Use the default Next.js output.

## Environment Variables

Set the backend API URL in Vercel:

```env
NEXT_PUBLIC_API_URL=https://tu-backend-render.onrender.com/api/v1
```

For local development:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

Do not include secrets in frontend environment variables. `NEXT_PUBLIC_*` values are visible to browsers.

## Local Validation

Run from `frontend`:

```bash
npm ci
npm run lint
npm run build
npm test
```

## Backend CORS

Add the Vercel URL to backend `ALLOWED_ORIGINS`:

```env
ALLOWED_ORIGINS="http://localhost:3001,https://skillflow-ai.vercel.app"
```

Add future custom domains to the same comma-separated list.

## Demo Flow

After deploying backend and frontend:

1. Open the Vercel URL.
2. Sign in with the demo account.
3. Confirm the demo banner reports the backend as connected.
4. Navigate Dashboard -> Employees -> Courses -> Training Sessions -> Enrollments -> Attendance -> Evaluations -> Certificates -> SENCE.

## Future Custom Domain

When a custom domain is configured in Vercel:

1. Add the custom frontend domain in Vercel.
2. Add the same origin to backend `ALLOWED_ORIGINS`.
3. Redeploy or restart the backend service.
