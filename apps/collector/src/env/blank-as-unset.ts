import { z } from 'zod';

/**
 * `schema`, reading a variable that is empty or only spaces as one that is not set, so a default
 * applies and a required variable is reported as missing. A workflow that maps a variable nobody set
 * passes it as an empty string.
 */
export function blankAsUnset<Output>(schema: z.ZodType<Output>): z.ZodType<Output> {
  return z.preprocess((value) => (typeof value === 'string' && value.trim() === '' ? undefined : value), schema);
}
