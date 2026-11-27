import { Network } from '@fair-fx/core';
import { z } from 'zod';
import { DEFAULT_CONFIG_DIR } from './env.constants.ts';
import type { CollectorEnv } from './env.types.ts';

export const collectorEnvSchema: z.ZodType<CollectorEnv> = z
  .object({
    DATABASE_URL: z.string().min(1),
    FAIRFX_NETWORK: z.enum(Network).default(Network.Mainnet),
    FAIRFX_CONFIG_DIR: z.string().min(1).default(DEFAULT_CONFIG_DIR),
  })
  .transform((env) => ({
    databaseUrl: env.DATABASE_URL,
    network: env.FAIRFX_NETWORK,
    configDir: env.FAIRFX_CONFIG_DIR,
  }));
