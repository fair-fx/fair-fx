import { z } from 'zod';
import { RateMathErrorCode } from '../rate/index.ts';

const integer = z
  .string()
  .regex(/^-?\d+$/)
  .transform((digits) => BigInt(digits));

const swapFields = {
  amount_in: integer,
  price_in: integer,
  decimals_in: z.int().nonnegative(),
  price_out: integer,
  decimals_out: z.int().nonnegative(),
};

/** The cases of one function: those that return `expected` and those refused with `error`. */
export function casesWith<Inputs extends z.ZodRawShape>(inputs: Inputs) {
  const named = { name: z.string(), ...inputs };
  return z.strictObject({
    returns: z.array(z.strictObject({ ...named, expected: integer })),
    refuses: z.array(z.strictObject({ ...named, error: z.enum(RateMathErrorCode) })),
  });
}

export const rateVectorsSchema = z.strictObject({
  ref_out: casesWith(swapFields),
  shortfall_bps: casesWith({ ref_out: integer, actual_out: integer }),
  floor: casesWith({ ref_out: integer, max_shortfall_bps: integer }),
  snapshot_2026_11_09: z.array(
    z.strictObject({ name: z.string(), ...swapFields, actual_out: integer, ref_out: integer, shortfall_bps: integer }),
  ),
});
