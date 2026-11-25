import { z } from 'zod';
import { Fiat } from '../fiat.ts';
import { Network } from '../network.ts';
import { accountId, contractId } from './fields.ts';
import { entryFor, parseOrThrow } from './parse.ts';

const LADDER_RUNGS = 10;
// Soroban token amounts are i128, which has at most 38 full decimal digits.
const MAX_DECIMALS = 38;

const pinnedAssetSchema = z.strictObject({
  contract: contractId,
  code: z.string().regex(/^[A-Za-z0-9]{1,12}$/, 'expected an asset code of 1 to 12 letters or digits'),
  issuer: accountId,
  fiat: z.enum(Fiat),
  decimals: z.int().min(0).max(MAX_DECIMALS),
});

const pairSchema = z
  .strictObject({ base: pinnedAssetSchema, quote: pinnedAssetSchema })
  .refine((pair) => pair.base.contract !== pair.quote.contract, 'base and quote are the same asset')
  .transform((pair) => ({ id: `${pair.base.code}/${pair.quote.code}`, ...pair }));

/** Input sizes in whole units of the input token. */
const ladderSchema = z
  .array(z.int().positive())
  .length(LADDER_RUNGS)
  .refine(isStrictlyIncreasing, 'expected each rung to be larger than the one before')
  .transform((rungs) => rungs.map(BigInt));

const pairsFileSchema = z.strictObject({
  ladder: ladderSchema,
  pairs: z.partialRecord(z.enum(Network), z.array(pairSchema)),
});

/** A token FairFX quotes, pinned by contract ID and by code plus issuer. */
export type PinnedAsset = Readonly<z.infer<typeof pinnedAssetSchema>>;

/** Two pinned assets. `id` is `BASE/QUOTE`, for example `USDC/EURC`. */
export type Pair = Readonly<z.infer<typeof pairSchema>>;

/** The pairs of one network and the shared ladder, from `config/pairs.json`. */
export interface PairsConfig {
  readonly network: Network;
  readonly ladder: readonly bigint[];
  readonly pairs: readonly Pair[];
}

/** Validates the parsed `pairs.json` and returns the pairs of `network`. Throws ConfigError. */
export function parsePairsConfig(json: unknown, network: Network): PairsConfig {
  const file = parseOrThrow(pairsFileSchema, json);
  return { network, ladder: file.ladder, pairs: entryFor(file.pairs, network) };
}

function isStrictlyIncreasing(values: readonly number[]): boolean {
  return values.every((value, i) => i === 0 || value > values[i - 1]!);
}
