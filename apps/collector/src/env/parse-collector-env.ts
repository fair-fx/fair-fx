import { ConfigError } from '@fair-fx/core';
import { z } from 'zod';
import { collectorEnvSchema } from './env.schema.ts';
import type { CollectorEnv } from './env.types.ts';

/**
 * The collector's settings from `env`, which is `process.env` in a real run. `DATABASE_URL` is
 * required; the network defaults to mainnet and the config folder to the repo's `config/`. Throws a
 * ConfigError that names the variable and never repeats its value.
 */
export function parseCollectorEnv(env: Readonly<Record<string, string | undefined>>): CollectorEnv {
  const parsed = collectorEnvSchema.safeParse(env);
  if (!parsed.success) {
    throw new ConfigError(`collector environment: ${z.prettifyError(parsed.error)}`);
  }

  return parsed.data;
}
