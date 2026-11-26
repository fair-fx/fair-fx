import type { z } from 'zod';
import type { RateLeg } from '../rate/index.ts';
import { rateVectorsSchema } from './rate-vectors.schema.ts';

/** `spec/vectors/rate-math.json` with its integers read as bigint. */
export type RateVectors = z.output<typeof rateVectorsSchema>;

/** Throws when the file has a missing, extra or malformed field, so a typo cannot skip a case. */
export function parseRateVectors(json: unknown): RateVectors {
  return rateVectorsSchema.parse(json);
}

interface LegFields {
  readonly price_in: bigint;
  readonly decimals_in: number;
  readonly price_out: bigint;
  readonly decimals_out: number;
}

export function legsOf(fields: LegFields): [input: RateLeg, output: RateLeg] {
  return [
    { price: fields.price_in, decimals: fields.decimals_in },
    { price: fields.price_out, decimals: fields.decimals_out },
  ];
}
