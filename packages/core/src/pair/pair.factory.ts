import { EURC, USDC } from '../asset/asset.factory.ts';
import { Network } from '../network/index.ts';
import type { Pair, PairsConfig } from './pair.ts';

// Spread over a valid default and loosely typed, so a test can write values the schema refuses.
type Patch = Readonly<Record<string, unknown>>;

export const LADDER_UNITS: readonly number[] = [100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000];

export function buildPairsConfig(overrides: Partial<PairsConfig> = {}): PairsConfig {
  const pair: Pair = { id: 'USDC/EURC', base: USDC, quote: EURC };
  return { network: Network.Mainnet, ladder: LADDER_UNITS.map(BigInt), pairs: [pair], ...overrides };
}

interface PairsFilePatch {
  readonly base?: Patch;
  readonly quote?: Patch;
  readonly ladder?: readonly unknown[];
}

/** Raw `pairs.json` with one mainnet pair, USDC/EURC, `base` and `quote` patched. */
export function buildPairsFile({ base = {}, quote = {}, ladder = LADDER_UNITS }: PairsFilePatch = {}): unknown {
  const pair = { base: { ...USDC, ...base }, quote: { ...EURC, ...quote } };
  return { ladder, pairs: { [Network.Mainnet]: [pair] } };
}
