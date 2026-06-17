import { z } from 'zod';

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1).optional(),
  JWT_SECRET: z.string().min(1).optional(),
  JWT_REFRESH_SECRET: z.string().min(1).optional(),
  JWT_ACCESS_EXPIRES_IN: z.string().min(1).default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().min(1).default('7d'),
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000,http://localhost:3001'),
  JSON_PAYLOAD_LIMIT: z.string().default('1mb'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(300),
  ENABLE_DEMO_BOOTSTRAP: z
    .string()
    .default('false')
    .transform((value) => value === 'true'),
  BOOTSTRAP_SECRET: z.string().min(1).optional(),
});

type ParsedEnvironment = z.infer<typeof environmentSchema>;

export type Environment = ParsedEnvironment & {
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  ALLOWED_ORIGINS_LIST: string[];
};

export function loadEnvironment(source: NodeJS.ProcessEnv = process.env): Environment {
  const parsed = environmentSchema.parse(source);

  return {
    ...parsed,
    DATABASE_URL: getRequiredEnvironmentValue(parsed, 'DATABASE_URL', source),
    JWT_SECRET: getRequiredEnvironmentValue(parsed, 'JWT_SECRET', source),
    JWT_REFRESH_SECRET: getRequiredEnvironmentValue(parsed, 'JWT_REFRESH_SECRET', source),
    ALLOWED_ORIGINS_LIST: parseAllowedOrigins(parsed.ALLOWED_ORIGINS),
  };
}

function getRequiredEnvironmentValue(
  parsed: ParsedEnvironment,
  name: 'DATABASE_URL' | 'JWT_SECRET' | 'JWT_REFRESH_SECRET',
  source: NodeJS.ProcessEnv,
): string {
  const value = parsed[name];
  if (value) {
    return value;
  }

  if (parsed.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  const developmentFallbacks: Record<typeof name, string> = {
    DATABASE_URL: 'postgresql://postgres:postgres@localhost:5433/skillflow?schema=public',
    JWT_SECRET: 'development-access-token-secret-change-before-production',
    JWT_REFRESH_SECRET: 'development-refresh-token-secret-change-before-production',
  };

  return source[name] ?? developmentFallbacks[name];
}

function parseAllowedOrigins(value: string): string[] {
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}
