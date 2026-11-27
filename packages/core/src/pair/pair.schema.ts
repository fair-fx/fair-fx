import { z } from 'zod';
import { pinnedAssetSchema } from '../asset/index.ts';
import { Network } from '../network/index.ts';
import { isDistinct, isStrictlyIncreasing } from '../shared/index.ts';
import { LADDER_RUNGS } from './pair.constants.ts';
import type { Pair } from './pair.types.ts';

const pairSchema: z.ZodType<Pair> = z
  .strictObject({ base: pinnedAssetSchema, quote: pinnedAssetSchema })
  .refine((pair) => pair.base.contract !== pair.quote.contract, 'base and quote are the same asset')
  .transform((pair) => ({ id: `${pair.base.code}/${pair.quote.code}`, ...pair }));

const ladderSchema: z.ZodType<readonly bigint[]> = z
  .array(z.int().positive())
  .length(LADDER_RUNGS)
  .refine(isStrictlyIncreasing, 'expected each rung to be larger than the one before')
  .transform((rungs) => rungs.map(BigInt));

// A sample is keyed by the id of its pair: with two pairs of one id the database refuses every run, or,
// when their amounts differ, stores rows that nothing tells apart.
const pairsSchema: z.ZodType<readonly Pair[]> = z
  .array(pairSchema)
  .refine(
    (pairs) => isDistinct(pairs.map((pair) => pair.id)),
    'expected each pair once, by the codes of its base and quote',
  );

export const pairsFileSchema = z.strictObject({
  ladder: ladderSchema,
  pairs: z.partialRecord(z.enum(Network), pairsSchema),
});
