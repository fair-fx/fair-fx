import { z } from 'zod';
import { pinnedAssetSchema } from '../asset/index.ts';
import { Network } from '../network/index.ts';
import { isStrictlyIncreasing } from '../shared/index.ts';
import type { Pair } from './pair.types.ts';

const LADDER_RUNGS = 10;

const pairSchema: z.ZodType<Pair> = z
  .strictObject({ base: pinnedAssetSchema, quote: pinnedAssetSchema })
  .refine((pair) => pair.base.contract !== pair.quote.contract, 'base and quote are the same asset')
  .transform((pair) => ({ id: `${pair.base.code}/${pair.quote.code}`, ...pair }));

const ladderSchema: z.ZodType<readonly bigint[]> = z
  .array(z.int().positive())
  .length(LADDER_RUNGS)
  .refine(isStrictlyIncreasing, 'expected each rung to be larger than the one before')
  .transform((rungs) => rungs.map(BigInt));

export const pairsFileSchema = z.strictObject({
  ladder: ladderSchema,
  pairs: z.partialRecord(z.enum(Network), z.array(pairSchema)),
});
