import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';

import { createApiRouter } from './interfaces/http/routes/api.routes.js';
import { errorHandler } from './interfaces/http/middlewares/error-handler.middleware.js';
import { createHealthRouter } from './interfaces/http/routes/health.routes.js';

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(pinoHttp());

  app.use(createHealthRouter());
  app.use('/api/v1', createApiRouter());
  app.use(errorHandler);

  return app;
}
