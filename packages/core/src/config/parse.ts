import { z } from 'zod';
import type { Network } from '../network.ts';

/** A config file has the wrong shape. The message lists each problem with its field path. */
export class ConfigError extends Error {
  override readonly name = 'ConfigError';
}

export function parseOrThrow<Schema extends z.ZodType>(schema: Schema, json: unknown): z.output<Schema> {
  const result = schema.safeParse(json);
  if (!result.success) {
    throw new ConfigError(z.prettifyError(result.error), { cause: result.error });
  }
  return result.data;
}

export function entryFor<T>(byNetwork: Partial<Record<Network, T>>, network: Network): T {
  const entry = byNetwork[network];
  if (entry === undefined) {
    throw new ConfigError(`no entry for ${network}`);
  }
  return entry;
}
