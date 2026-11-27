import { Network } from '@fair-fx/core';
import { z } from 'zod';
import { blankAsUnset } from './blank-as-unset.ts';
import { DEFAULT_CONFIG_DIR } from './env.constants.ts';
import type { CollectorEnv } from './env.types.ts';

export const collectorEnvSchema: z.ZodType<CollectorEnv> = z
  .object({
    DATABASE_URL: blankAsUnset(z.string()),
    FAIRFX_NETWORK: blankAsUnset(z.enum(Network).default(Network.Mainnet)),
    FAIRFX_CONFIG_DIR: blankAsUnset(z.string().default(DEFAULT_CONFIG_DIR)),
  })
  .transform((env) => ({
    databaseUrl: env.DATABASE_URL,
    network: env.FAIRFX_NETWORK,
    configDir: env.FAIRFX_CONFIG_DIR,
  }));
