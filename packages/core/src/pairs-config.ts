import { ConfigError } from './config-error.ts';
import { Fiat } from './fiat.ts';
import {
  readArray,
  readContractId,
  readEnum,
  readInteger,
  readNetworkEntry,
  readObject,
  readRecord,
  readString,
} from './json-fields.ts';
import type { Network } from './network.ts';

/** A token FairFX quotes, pinned by contract ID and by code plus issuer. */
export interface PinnedAsset {
  readonly contract: string;
  readonly code: string;
  readonly issuer: string;
  readonly fiat: Fiat;
  readonly decimals: number;
}

export interface Pair {
  /** `BASE/QUOTE`, for example `USDC/EURC`. */
  readonly id: string;
  readonly base: PinnedAsset;
  readonly quote: PinnedAsset;
}

/** The pairs of one network and the shared ladder, from `config/pairs.json`. */
export interface PairsConfig {
  readonly network: Network;
  /** Input sizes in whole units of the input token, strictly increasing. */
  readonly ladder: readonly bigint[];
  readonly pairs: readonly Pair[];
}

/** How a caller names an asset. A code alone is not one: anyone can issue an asset with any code. */
export type AssetRef = { readonly contract: string } | { readonly code: string; readonly issuer: string };

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

const LADDER_RUNGS = 10;
// Soroban token amounts are i128, which has at most 38 full decimal digits.
const MAX_DECIMALS = 38;
const CLASSIC_ASSET = /^(?<code>[A-Za-z0-9]{1,12}):(?<issuer>G[A-Z2-7]{55})$/;

/** Validates the parsed `pairs.json` and returns the pairs of `network`. Throws ConfigError. */
export function parsePairsConfig(json: unknown, network: Network): PairsConfig {
  const root = readObject(json, 'pairs config', ['ladder', 'pairs']);
  const field = `pairs.${network}`;
  const entries = Object.entries(readRecord(readNetworkEntry(root.pairs, 'pairs', network), field));
  return {
    network,
    ladder: readLadder(root.ladder),
    pairs: entries.map(([id, value]) => readPair(id, value, `${field}.${id}`)),
  };
}

/** Returns the pinned asset `ref` names, or throws UnpinnedAssetError. */
export function requirePinnedAsset(config: PairsConfig, ref: AssetRef): PinnedAsset {
  const asset = config.pairs.flatMap((pair) => [pair.base, pair.quote]).find((pinned) => matches(pinned, ref));
  if (asset === undefined) {
    throw new UnpinnedAssetError(config.network, ref);
  }
  return asset;
}

function readLadder(value: unknown): readonly bigint[] {
  const rungs = readArray(value, 'ladder').map((rung, i) => readInteger(rung, `ladder[${i}]`, 1, Number.MAX_SAFE_INTEGER));
  if (rungs.length !== LADDER_RUNGS) {
    throw new ConfigError(`ladder: expected ${LADDER_RUNGS} rungs, got ${rungs.length}`);
  }
  const notIncreasing = rungs.findIndex((rung, i) => i > 0 && rung <= rungs[i - 1]!);
  if (notIncreasing !== -1) {
    throw new ConfigError(`ladder[${notIncreasing}]: expected more than the rung before it`);
  }
  return rungs.map(BigInt);
}

function readPair(id: string, value: unknown, field: string): Pair {
  const entry = readObject(value, field, ['base', 'quote']);
  const base = readAsset(entry.base, `${field}.base`);
  const quote = readAsset(entry.quote, `${field}.quote`);
  if (base.contract === quote.contract) {
    throw new ConfigError(`${field}: base and quote are the same asset`);
  }
  if (id !== `${base.code}/${quote.code}`) {
    throw new ConfigError(`${field}: expected the id ${base.code}/${quote.code}`);
  }
  return { id, base, quote };
}

function readAsset(value: unknown, field: string): PinnedAsset {
  const entry = readObject(value, field, ['contract', 'classic', 'fiat', 'decimals']);
  const classic = readString(entry.classic, `${field}.classic`);
  const { code, issuer } = CLASSIC_ASSET.exec(classic)?.groups ?? {};
  if (code === undefined || issuer === undefined) {
    throw new ConfigError(`${field}.classic: expected CODE:ISSUER, got ${classic}`);
  }
  return {
    contract: readContractId(entry.contract, `${field}.contract`),
    code,
    issuer,
    fiat: readEnum(Fiat, entry.fiat, `${field}.fiat`),
    decimals: readInteger(entry.decimals, `${field}.decimals`, 0, MAX_DECIMALS),
  };
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
