import { z } from 'zod';

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

/** Returns `byKey[key]`, or throws ConfigError when the file has no entry for it. */
export function entryFor<K extends string, T>(byKey: Partial<Record<K, T>>, key: K): T {
  const entry = byKey[key];
  if (entry === undefined) {
    throw new ConfigError(`no entry for ${key}`);
  }

  return entry;
}
