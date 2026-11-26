import { parseDecimalAmount } from '@fair-fx/core';
import { z } from 'zod';
import type { SdexHop, SdexPath } from './sdex.types.ts';

/** Horizon writes every classic amount as a decimal string with 7 decimals. */
export const CLASSIC_DECIMALS = 7;

const amountSchema: z.ZodType<bigint> = z
  .string()
  .transform((text) => parseDecimalAmount(text, CLASSIC_DECIMALS))
  .pipe(z.bigint('expected a decimal amount').positive('expected an amount above zero'));

const hopSchema: z.ZodType<SdexHop> = z.union([
  z.object({ asset_type: z.literal('native') }).transform(() => 'native' as const),
  z
    .object({ asset_code: z.string(), asset_issuer: z.string() })
    .transform((hop) => ({ code: hop.asset_code, issuer: hop.asset_issuer })),
]);

const pathSchema: z.ZodType<SdexPath> = z
  .object({ destination_amount: amountSchema, path: z.array(hopSchema) })
  .transform((record) => ({ amountOut: record.destination_amount, route: { path: record.path } }));

/** The body of `GET /paths/strict-send`, read as the paths it lists. */
export const strictSendPathsSchema: z.ZodType<readonly SdexPath[]> = z
  .object({ _embedded: z.object({ records: z.array(pathSchema) }) })
  .transform((body) => body._embedded.records);

/** The body Horizon sends with an HTTP error. `extras.reason` names what was wrong with the request. */
export const horizonProblemSchema = z.object({
  title: z.string(),
  extras: z.object({ reason: z.string() }).optional(),
});
