import { z } from 'zod';
// Validated once at boot by ConfigModule: a bad/missing var throws and stops startup (fail-fast).
const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(8080),
  ALLOWED_ORIGINS: z.string().default('http://localhost:8080'),
  // Injected by the platform's secret plumbing. OPTIONAL on purpose: the data layer is
  // null-safe (a missing/unreachable database logs a warning; /health stays up), so the
  // container must BOOT without it: a required field here crash-loops the task and hides
  // the real cause (a secret-injection problem) behind an unreadable startup failure.
  DATABASE_URL: z.string().min(1).optional(),
});
export function validateEnv(config: Record<string, unknown>): z.infer<typeof EnvSchema> {
  const parsed = EnvSchema.safeParse(config);
  if (!parsed.success) {
    const detail = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error('Invalid environment configuration:\n' + detail);
  }
  return parsed.data;
}
