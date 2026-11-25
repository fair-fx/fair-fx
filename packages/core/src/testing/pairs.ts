import { Network, type Pair, type PairsConfig } from '../index.ts';
import { EURC, USDC } from './assets.ts';
import type { Patch } from './patch.ts';

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
