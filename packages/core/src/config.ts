import { z } from 'zod';
import { Fiat } from './fiat.ts';
import { Network } from './network.ts';

const LADDER_RUNGS = 10;
// Soroban token amounts are i128, which has at most 38 full decimal digits.
const MAX_DECIMALS = 38;

// Shape only. The StrKey checksum needs the Stellar SDK, so the test of the real config files checks it.
const accountId = z.string().regex(/^G[A-Z2-7]{55}$/, 'expected an account ID (G...)');
const contractId = z.string().regex(/^C[A-Z2-7]{55}$/, 'expected a contract ID (C...)');
const httpsUrl = z.url({ protocol: /^https$/, error: 'expected an https URL' });

const networkSchema = z.strictObject({
  passphrase: z.string().min(1),
  horizonUrl: httpsUrl,
  rpcUrl: httpsUrl,
  aquariusFindPathUrl: httpsUrl,
  soroswapRouter: contractId,
  reflectorFiatFeed: contractId,
  /** Source account for read-only simulations. Nothing is signed with it. */
  simulationSource: accountId,
});

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

const networksFileSchema = z.partialRecord(z.enum(Network), networkSchema);

const pairsFileSchema = z.strictObject({
  ladder: ladderSchema,
  pairs: z.partialRecord(z.enum(Network), z.array(pairSchema)),
});

/** Passphrase, endpoints and contract addresses of one network, from `config/networks.json`. */
export type NetworkConfig = Readonly<z.infer<typeof networkSchema>>;

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

/** How a caller names an asset. A code alone is not one: anyone can issue an asset with any code. */
export type AssetRef = { readonly contract: string } | { readonly code: string; readonly issuer: string };

/** A config file has the wrong shape. The message lists each problem with its field path. */
export class ConfigError extends Error {
  override readonly name = 'ConfigError';
}

/** A lookup named an asset that is not in `config/pairs.json` for this network. */
export class UnpinnedAssetError extends Error {
  override readonly name = 'UnpinnedAssetError';

  constructor(
    readonly network: Network,
    readonly ref: AssetRef,
  ) {
    super(`${describeRef(ref)} is not a pinned asset on ${network}`);
  }
}

/** Validates the parsed `networks.json` and returns the entry for `network`. Throws ConfigError. */
export function parseNetworkConfig(json: unknown, network: Network): NetworkConfig {
  return entryFor(parseOrThrow(networksFileSchema, json), network);
}

/** Validates the parsed `pairs.json` and returns the pairs of `network`. Throws ConfigError. */
export function parsePairsConfig(json: unknown, network: Network): PairsConfig {
  const file = parseOrThrow(pairsFileSchema, json);
  return { network, ladder: file.ladder, pairs: entryFor(file.pairs, network) };
}

/** Returns the pinned asset `ref` names, or throws UnpinnedAssetError. */
export function requirePinnedAsset(config: PairsConfig, ref: AssetRef): PinnedAsset {
  const asset = config.pairs.flatMap((pair) => [pair.base, pair.quote]).find((pinned) => matches(pinned, ref));
  if (asset === undefined) {
    throw new UnpinnedAssetError(config.network, ref);
  }
  return asset;
}

function matches(asset: PinnedAsset, ref: AssetRef): boolean {
  if ('contract' in ref) {
    return asset.contract === ref.contract;
  }
  return asset.code === ref.code && asset.issuer === ref.issuer;
}

function describeRef(ref: AssetRef): string {
  return 'contract' in ref ? ref.contract : `${ref.code}:${ref.issuer}`;
}

function entryFor<T>(byNetwork: Partial<Record<Network, T>>, network: Network): T {
  const entry = byNetwork[network];
  if (entry === undefined) {
    throw new ConfigError(`no entry for ${network}`);
  }
  return entry;
}

function parseOrThrow<Schema extends z.ZodType>(schema: Schema, json: unknown): z.output<Schema> {
  const result = schema.safeParse(json);
  if (!result.success) {
    throw new ConfigError(z.prettifyError(result.error), { cause: result.error });
  }
  return result.data;
}

function isStrictlyIncreasing(values: readonly number[]): boolean {
  return values.every((value, i) => i === 0 || value > values[i - 1]!);
}
