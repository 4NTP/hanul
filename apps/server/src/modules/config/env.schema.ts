import { z } from 'zod';

export const envSchema = z.object({
  PORT: z.number().optional(),
  NODE_ENV: z.enum(['development', 'production', 'local']),
  DATABASE_URL: z.url(),
  SERVER_URL: z.url(),
  JWT_SECRET: z.string(),
  JWT_ISSUER: z.string(),
  SOLAR_API_KEY: z.string(),
  CORS_ORIGIN: z.string(),
});

export type Env = z.infer<typeof envSchema>;
