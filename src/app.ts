import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';

import { loadEnvironment, type Environment } from './config/environment.js';
import { createApiRouter } from './interfaces/http/routes/api.routes.js';
import { errorHandler } from './interfaces/http/middlewares/error-handler.middleware.js';
import { createHealthRouter } from './interfaces/http/routes/health.routes.js';
import { createSystemRouter } from './interfaces/http/routes/system.routes.js';
import { createGlobalRateLimit } from './interfaces/http/middlewares/global-rate-limit.middleware.js';

export function createApp(environment: Environment = loadEnvironment()): Express {
  const app = express();

  app.use(pinoHttp());
  app.use(helmet());
  app.use(
    cors({
      exposedHeaders: ['ETag'],
      origin(origin, callback) {
        if (!origin || environment.ALLOWED_ORIGINS_LIST.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error('CORS origin denied'));
      },
    }),
  );
  app.use(
    createGlobalRateLimit({
      windowMs: environment.RATE_LIMIT_WINDOW_MS,
      maxRequests: environment.RATE_LIMIT_MAX_REQUESTS,
    }),
  );
  app.use(express.json({ limit: environment.JSON_PAYLOAD_LIMIT }));

  app.use(createHealthRouter());
  app.use('/api/v1', createSystemRouter(environment));
  app.use('/api/v1', createApiRouter());
  app.use(errorHandler);

  return app;
}
