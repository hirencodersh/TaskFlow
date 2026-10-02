import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({
  path: '.env',
});

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_ACCESS_SECRET: z.string().min(1, 'JWT_ACCESS_SECRET is required'),
  JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET is required'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map(
      (issue) =>
        `  - ${issue.path.join('.') || 'env'}: ${issue.message}`,
    )
    .join('\n');

  throw new Error(`Missing or invalid environment variables:\n${details}`);
}

export const env = parsed.data;