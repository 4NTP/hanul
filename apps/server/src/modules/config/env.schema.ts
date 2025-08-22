import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'local']),
  DATABASE_URL: z.url(),
  SERVER_URL: z.url(),
  JWT_SECRET: z.string(),
  JWT_ISSUER: z.string(),
});

export type Env = z.infer<typeof envSchema>;
