import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default('7d'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  CORS_ORIGIN: z.string().default('http://localhost:5173,http://localhost:3000'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:');
  console.error(parsed.error.format());
  process.exit(1);
}

// Production safety: warn if CORS is still using development defaults
if (
  parsed.data.NODE_ENV === 'production' &&
  parsed.data.CORS_ORIGIN.includes('localhost')
) {
  console.warn(
    'WARNING: CORS_ORIGIN contains localhost origins in production mode. ' +
    'Set CORS_ORIGIN to your actual frontend domain(s) in the .env file.'
  );
}

// Production safety: refuse to boot with a known/placeholder JWT secret.
// JWT forgery with the dev secret would compromise every tenant.
const DEV_JWT_SECRETS = [
  'indolj-super-secret-jwt-key-dev-only-change-in-prod',
  'change-me',
  'secret',
];
if (
  parsed.data.NODE_ENV === 'production' &&
  (parsed.data.JWT_SECRET.length < 32 ||
    DEV_JWT_SECRETS.includes(parsed.data.JWT_SECRET))
) {
  console.error(
    'FATAL: JWT_SECRET must be a strong, unique random string (>= 32 chars) in production. ' +
    'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"'
  );
  process.exit(1);
}

export const env = parsed.data;
